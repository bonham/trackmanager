<template>
  <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
    <div id="mapdiv" class="flex-grow-1 d-flex flex-column justify-content-center align-items-center" />
    <div v-if="loading" class="mapspinner">
      <b-spinner />
    </div>
    <div ref="popupdiv">
      <div v-if="popoverData" class="map-popover card shadow-sm text-secondary">
        <div class="card-header py-1 px-2 small fw-bold map-popover-drag-handle">{{ popoverData.date }}</div>
        <div class="card-body py-1 px-2 small">
          <div>{{ popoverData.name }}</div>
          <div>Dist: {{ popoverData.distance }}</div>
          <div v-if="popoverData.ascent">Ascent: {{ popoverData.ascent }}</div>
          <router-link :to="{ name: 'TrackDetailPage', params: { id: popoverData.trackId, sid: props.sid } }"
            class="mt-1 d-inline-block text-secondary">
            Details
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { BSpinner } from 'bootstrap-vue-next'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import type { PopoverData } from '@/lib/mapservices/ManagedMap'
import type { MultiLineStringWithTrack } from '@/lib/zodSchemas'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers'
import { getIdListByExtentAndTime, getTrackIdsByYear } from '@/lib/trackServices'
import _ from 'lodash'
import { useConfigStore } from '@/stores/configstore'
import { useMapStateStore } from '@/stores/mapstate'
import { StyleFactoryFixedColors, THREE_BROWN_COLORSTYLE, FIVE_COLORFUL_COLORSTYLE } from '@/lib/mapStyles';
import { queue, type QueueObject } from 'async'
import { createTrackLoadingAsyncWorker, type IdList, type Task } from '@/lib/trackLoadAsyncWorker'
import { reportError } from '@/stores/errorstore'

const NUMWORKERS = 4
const BATCHSIZE = 5
/**
 * This component provides a div anchor with the openlayers map attached to it.
 * It is using javascript class ManagedMap to interact with openlayers library.
 * It is setting from default styles for track coloring.
 * It can receive commands to draw tracks on the map. Commands are coming from TracksMapPage or other pages.
 *
 *  Commands are:
 * - load track from a calendar year
 * - load all tracks in DB
 * - load tracks in a certain extent
 * - load a single track by id
 * 
 * It will dynamically decide to fetch geojson structure from backend if they have not been fetched before.
 * It has optimization to toggle track visibility in OL vector layers for tracks which are already loaded but shot not be show or shown again. 
 * 
 */

const props = defineProps({
  sid: {
    type: String,
    required: true
  }
})

// reactive data
const popupdiv = ref<(null | HTMLElement)>(null) // template ref
const loading = ref(false)
const popoverData = ref<PopoverData | null>(null)

// stores
const mapStateStore = useMapStateStore()
const configStore = useConfigStore()

// ------------ Initialize map and set trackstyle from configstore
const mmap = new ManagedMap()

// load config
configStore.loadConfig(props.sid)
  .then(() => {
    const TRACKSTYLE = configStore.get("TRACKSTYLE")

    if (TRACKSTYLE === 'THREE_BROWN') {
      mmap.setStyleFactory(new StyleFactoryFixedColors(THREE_BROWN_COLORSTYLE))
    } else if (TRACKSTYLE === 'FIVE_COLORFUL') {
      mmap.setStyleFactory(new StyleFactoryFixedColors(FIVE_COLORFUL_COLORSTYLE))
    } else {
      throw Error(`Unknown TRACKSTYLE config value ${TRACKSTYLE}`)
    }
  })
  .catch((e) => reportError("Could not load config", e))

// Initialize loading worker and queue
const addLayerFunc = (featureWithTrack: MultiLineStringWithTrack) => mmap.addTrackLayer(featureWithTrack)

// worker function and queue
const loaderWorker = createTrackLoadingAsyncWorker(
  addLayerFunc,
  props.sid
)
const loaderQueue = queue(loaderWorker, NUMWORKERS)



// ------------ Mount map and popup to dom
onMounted(() => {
  nextTick(() => {
    if (mmap === null) {
      console.error("mmap not initalized")
      return
    }
    if (popupdiv.value === null) {
      console.error("popupdiv not initialized")
      return
    }
    mmap.map.setTarget('mapdiv')
    /**
     * Initializes the map popup with callback handlers
     * @param {HTMLElement} popupdiv.value - The DOM element that will contain the popup content
     * @param {Function} callback - Callback function invoked when popup data is available, updates popoverData with the provided data
     * @param {Function} callback - Callback function invoked when popup is closed, clears popoverData by setting it to null
     */
    mmap.initPopup(
      popupdiv.value,
      (data) => { popoverData.value = data },
      () => { popoverData.value = null }
    )
  }).catch((err) => {
    reportError("Error in nextTick", err)
  })
})

let controller: AbortController | undefined = undefined
onUnmounted(() => {
  controller?.abort()
})

function makeVisible(ids: IdList, mmap: ManagedMap, queue: QueueObject<Task>, zoomOut: boolean) {

  queue.remove(() => true)
  controller?.abort() // abort tasks of previous run

  // calculate which tracks to load , which to flip visibility
  const tvm = new TrackVisibilityManager(
    mmap.getTrackIdsVisible(), // currently visible
    ids, // to be visible
    mmap.getTrackIds() // already loaded
  )

  // A: Set tracks already loaded to be visible
  const toggleIds = tvm.toggleToVisible()
  console.log('Toggle: ', toggleIds)
  _.forEach(toggleIds, function (id) { mmap.setVisible(id) })

  // B: tracks to hide
  const toHide = tvm.toBeHidden()
  console.log('To be hidden: ', toHide)
  _.forEach(toHide, function (id) { mmap.setInvisible(id) })

  // C: load missing tracks and add vector layers to map
  const trackIdsToBeLoaded = tvm.toBeLoaded()
  console.log('To be loaded: ', trackIdsToBeLoaded)


  // process toBeLoaded list and cut it in chunks
  controller = new AbortController()
  const listOfTasks: Task[] = []
  for (let i = 0; i < trackIdsToBeLoaded.length; i += BATCHSIZE) {
    const batch: IdList = trackIdsToBeLoaded.slice(i, i + BATCHSIZE)
    const task: Task = { idList: batch, signal: controller.signal }
    listOfTasks.push(task)
  }

  // push chunks to queue
  if (listOfTasks.length > 0) {

    // stop spinner when queue empty ( one time promise)
    queue.drain()
      .then(
        () => {
          loading.value = false
          if (zoomOut) { mmap.setExtentAndZoomOut() }
        }
      )
      .catch((e) => reportError("Error draining load queue", e))

    loading.value = true // should be true already
    queue.push<Task>(listOfTasks, (err, retVal) => {
      if (err) {
        if (err.name === 'AbortError') console.log("Aborted worker")
        else reportError("Error in worker", err)
      }
      if (retVal) console.log("Return value from worker", retVal)
    })
  } else {
    // There was nothing to push - maybe because all was loaded already
    loading.value = false
    if (zoomOut) { mmap.setExtentAndZoomOut() }
  }
}

// ------------ Watch and execute loading commands
watch(
  () => mapStateStore.loadCommand,
  async (command) => {

    console.log(`received command ${command.command}`)

    mmap.clearSelection()
    mmap.disposePopover()

    const zoomOut = command.zoomOut ?? false
    loading.value = true // set to false in makeVisible

    if (command.command === 'all') {

      const bbox = mmap.getMapViewBbox()
      const allIds: number[] = await getIdListByExtentAndTime(bbox, props.sid)

      makeVisible(allIds, mmap, loaderQueue, zoomOut)

    } else if (command.command === 'year') {

      const year = command.payload
      const idList = await getTrackIdsByYear(year, props.sid)
      makeVisible(idList, mmap, loaderQueue, zoomOut)

    } else if (command.command === 'track') {

      const id = command.payload
      makeVisible([id], mmap, loaderQueue, zoomOut)

    } else {

      console.error(`unknown command ${command.command}`)
    }
  }
)

</script>

<style>
@import 'ol/ol.css';

#mapdiv {
  width: 100%;
  /* needed - otherwise map does not show */

  flex-grow: 1;
  /* maybe not needed */

  /* height: 30em; */
  /* not needed and not useful - height is set as vh-100 in topmost container */

  min-height: 100%;
}

.map-zoom-control-group {
  top: 0.5em;
  left: 0.5em;
}

.mapspinner {
  position: absolute;
}

.map-popover {
  min-width: 200px;
  white-space: nowrap;
}

.map-popover-drag-handle {
  cursor: grab;
}

.map-popover-drag-handle.grabbing {
  cursor: grabbing;
}
</style>
