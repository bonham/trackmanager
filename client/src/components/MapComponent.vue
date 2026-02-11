<template>
  <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
    <div id="mapdiv" class="flex-grow-1 d-flex flex-column justify-content-center align-items-center" />
    <div v-if="loading" class="mapspinner">
      <b-spinner />
    </div>
    <div ref="popupdiv"></div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { BSpinner } from 'bootstrap-vue-next'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import type { GeoJsonWithTrack } from '@/lib/mapservices/ManagedMap'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers'
import { getIdListByExtentAndTime, getTrackIdsByYear } from '@/lib/trackServices'
import _ from 'lodash'
import { useConfigStore } from '@/stores/configstore'
import { useMapStateStore } from '@/stores/mapstate'
import { StyleFactoryFixedColors, THREE_BROWN_COLORSTYLE, FIVE_COLORFUL_COLORSTYLE } from '@/lib/mapStyles';
import { queue, type QueueObject } from 'async'
import { createTrackLoadingAsyncWorker, type IdList, type Task } from '@/lib/trackLoadAsyncWorker'

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
  .catch((e) => console.error("Could not load config", e))

// Initialize loading worker and queue
const addLayerFunc = (gwt: GeoJsonWithTrack) => mmap.addTrackLayer(gwt)

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
    mmap.initPopup(popupdiv.value)
  }).catch((err) => {
    console.error("Error in nextTick", err)
  })
})

let controller: AbortController | undefined = undefined

function makeVisible(ids: IdList, mmap: ManagedMap, queue: QueueObject<Task>, zoomOut: boolean) {

  controller?.abort()
  queue.remove(() => true)

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

  // stop spinner when queue empty ( one time promise)
  queue.drain()
    .then(
      () => {
        loading.value = false
        if (zoomOut) { mmap.setExtentAndZoomOut() }
      }
    )
    .catch(() => console.error("what??"))

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
    loading.value = true
    queue.push<Task>(listOfTasks, (err, retVal) => {
      if (err) {
        if (err.name === 'AbortError') console.log("Aborted worker")
        else console.error("Error in worker", err)
      }
      if (retVal) console.log("Return value from worker", retVal)
    })
  }
}

// ------------ Watch and execute loading commands
watch(
  () => mapStateStore.loadCommand,
  async (command) => {

    console.log(`received command ${command.command}`)

    mmap.clearSelection()
    mmap.popovermgr?.dispose()

    const zoomOut = command.zoomOut ?? false

    if (command.command === 'all') {

      const bbox = mmap.getMapViewBbox()
      const allIds: number[] = await getIdListByExtentAndTime(bbox, props.sid)
      makeVisible(allIds, mmap, loaderQueue, zoomOut)


      return // done here

    } else if (command.command === 'year') {

      const year = command.payload
      const idList = await getTrackIdsByYear(year, props.sid)
      makeVisible(idList, mmap, loaderQueue, zoomOut)

    } else if (command.command === 'track') {

      const id = command.payload
      makeVisible([id], mmap, loaderQueue, zoomOut)

    } else {

      throw Error(`unknown command ${command.command}`)

    }
  }
)

</script>

<style>
@import '../../node_modules/ol/ol.css';

#mapdiv {
  width: 100%;
  /* needed - otherwise map does not show */

  flex-grow: 1;
  /* maybe not needed */

  /* height: 30em; */
  /* not needed and not useful - height is set as vh-100 in topmost container */

  min-height: 100%;
}

.map-control-expand {
  top: 4em;
  left: .5em;
}

.mapspinner {
  position: absolute;
}

.popover-body {
  min-width: 276px;
}
</style>
