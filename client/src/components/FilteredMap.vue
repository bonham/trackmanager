<template>
  <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
    <div id="mapdiv" class="flex-grow-1 d-flex flex-column justify-content-center align-items-center" />
    <div v-if="loading" class="mapspinner">
      <b-spinner />
    </div>
    <div ref="popupdiv"></div>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import { BSpinner } from 'bootstrap-vue-next'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import type { GeoJSONWithTrackId } from '@/lib/mapservices/ManagedMap'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers'
import { getGeoJson, getTracksByExtent, getTracksByYear } from '@/lib/trackServices'
import _ from 'lodash'

import { useMapStateStore } from '@/stores/mapstate'
const mapStateStore = useMapStateStore()

import { useTracksStore } from '@/storepinia'
const trackStore = useTracksStore()

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

// reactive data
const popupdiv: Ref<(null | HTMLElement)> = ref(null) // template ref
const loading = ref(false)
const mmap: Ref<(null | ManagedMap)> = ref(null)


// create map object
// the callbackfunction is to react on 'select' events - e.g. setting data in a store or send events.
mmap.value = new ManagedMap()


// method is redrawing tracks AND resetting selection ! 
// ( the latter might need to be factored out)
async function redrawTracks(zoomOut = false) {
  loading.value = true
  let mm: ManagedMap
  if (mmap.value === null) {
    console.error("mmap not initalized")
    return
  }
  mm = mmap.value

  // reset selection and popups
  mm.clearSelection()
  mm.popovermgr?.dispose()

  const tvm = new TrackVisibilityManager(
    mm.getTrackIdsVisible(),
    trackStore.getLoadedTrackIds,
    mm.getTrackIds()
  )

  // A1: set existing visible
  const toggleIds = tvm.toggleToVisible()
  console.log('Toggle: ', toggleIds)

  _.forEach(toggleIds, function (id) { mm.setVisible(id) })

  // A2: load missing and add vector layer to map
  const toBeLoaded = tvm.toBeLoaded()
  console.log('To be loaded: ', toBeLoaded)

  let resultSet: GeoJSONWithTrackId[]
  if (toBeLoaded.length > 0) {
    resultSet = await getGeoJson(toBeLoaded, props.sid)
  } else {
    resultSet = []
  }
  resultSet.forEach(result => {
    const tr = trackStore.tracksById[result.id]
    mm.addTrackLayer({ track: tr, geojson: result.geojson })
  })

  // B: tracks to hide
  const toHide = tvm.toBeHidden()
  console.log('To be hidden: ', toHide)
  _.forEach(toHide, function (id) { mm.setInvisible(id) })

  loading.value = false
  if (zoomOut) {
    mm.setExtentAndZoomOut()
  }
}


// watch if the viewport is resized and resize the map
watch(
  () => trackStore.resizeMap,

  (newValue, oldValue) => {
    if (newValue === true) {
      if (oldValue === true) {
        console.log('Triggered watch of updateSize while update was running')
      }
      if (mmap.value) {
        mmap.value.map.updateSize()
        trackStore.resizeMap = false
      } else {
        console.error("mmap was not initialized")
      }
    }
  }
)

// watching different commands
watch(
  () => mapStateStore.loadCommand,
  async (command) => {

    // load year - will not be repeated if submitted twice
    if (command.command === 'year') {

      const year = command.payload
      console.log(`received year command ${year}`)
      await loadTracksOfYear(year)
      await redrawTracks(!!command.zoomOut)


      // Load extent - will aways be executed
    } else if (command.command === 'bbox') {

      if (command.completed) { return }

      console.log("Received request to update extent")
      const map = mmap.value as ManagedMap
      const bbox = map.getMapViewBbox()
      const tracks = await getTracksByExtent(bbox, props.sid)
      console.log("tracks from extent call", tracks)
      trackStore.setLoadedTracks(tracks)
      await redrawTracks()

      command.completed = true

    }
  }
)

async function loadTracksOfYear(year: number) {

  const sid = props.sid
  try {
    loading.value = true
    const tracks = await getTracksByYear(year, sid)
    trackStore.setLoadedTracks(tracks)
  } catch (e) {
    console.error('Error loading tracks by year', e)
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  nextTick(() => {
    if (mmap.value === null) {
      console.error("mmap not initalized")
      return
    }
    if (popupdiv.value === null) {
      console.error("popupdiv not initialized")
      return
    }
    mmap.value.map.setTarget('mapdiv')
    mmap.value.initPopup(popupdiv.value)
  })
})

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
