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
import type { GeoJSONWithTrackId } from '@/lib/mapservices/ManagedMap'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers'
import { getGeoJson, getTracksByExtent, getTracksByYear, getTrackById, getAllTracks } from '@/lib/trackServices'
import _ from 'lodash'
import { useConfigStore } from '@/stores/configstore'
import { useMapStateStore } from '@/stores/mapstate'
import { StyleFactoryFixedColors } from '@/lib/mapStyles';
import { TrackBag } from '@/lib/TrackBag'
import { Track } from '@/lib/Track'


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

// stores
const mapStateStore = useMapStateStore()
const configStore = useConfigStore()

// reactive data
const popupdiv = ref<(null | HTMLElement)>(null) // template ref
const loading = ref(false)

// Object to interact with openlayers
const mmap = new ManagedMap()

// tracks
const trackBag = new TrackBag()

// watching and execute incoming commands
type TrackLoadFunction = (() => Promise<Track[]>)
watch(
  () => mapStateStore.loadCommand, async (command) => {

    // calculate the load function based on command and args

    let loadFunc: TrackLoadFunction
    console.log(`received command ${command.command}`)

    if (command.command === 'all') {

      loadFunc = () => getAllTracks(props.sid)

    } else if (command.command === 'year') {

      const year = command.payload
      loadFunc = () => getTracksByYear(year, props.sid)

    } else if (command.command === 'bbox') {

      const bbox = mmap.getMapViewBbox()
      loadFunc = () => getTracksByExtent(bbox, props.sid)

    } else if (command.command === 'track') {

      const id = command.payload
      loadFunc = async () => {
        const singleTrack = await getTrackById(id, props.sid)
        if (singleTrack === null) {
          console.error(`Could not fetch track with id ${id}`)
          return []
        } else {
          return [singleTrack]
        }
      }
    } else {
      loadFunc = () => Promise.resolve([])
    }

    // execute the load function
    loading.value = true
    const tracks = await loadFunc()
    // put in bag ;-)
    trackBag.setLoadedTracks(tracks)

    // finally redraw
    await redrawTracks(!!command.zoomOut)
    loading.value = false
  }
)

// method is redrawing tracks AND resetting selection ! 
// ( the latter might need to be factored out)
async function redrawTracks(zoomOut = false) {
  if (mmap === null) {
    console.error("mmap not initalized")
    return
  }
  // trackstyle from configstore
  await configStore.loadConfig(props.sid)
  const TRACKSTYLE = configStore.get("TRACKSTYLE")

  if (TRACKSTYLE === 'THREE_BROWN') {
    // all good
  } else if (TRACKSTYLE === 'FIVE_COLORFUL') {
    // brown, orange, red, green, blue
    const tStyle = new StyleFactoryFixedColors([
      '#a52a2a',
      '#ffa500',
      '#ff0000',
      '#008000',
      '#0000ff',
    ])
    mmap.setStyleFactory(tStyle)
  } else {
    throw Error(`Unknown TRACKSTYLE config value ${TRACKSTYLE}`)
  }

  // reset selection and popups
  mmap.clearSelection()
  mmap.popovermgr?.dispose()

  const tvm = new TrackVisibilityManager(
    mmap.getTrackIdsVisible(),
    trackBag.getLoadedTrackIds(),
    mmap.getTrackIds()
  )

  // A1: set existing visible
  const toggleIds = tvm.toggleToVisible()
  console.log('Toggle: ', toggleIds)

  _.forEach(toggleIds, function (id) { mmap.setVisible(id) })

  // A2: load missing and add vector layer to map
  const toBeLoaded = tvm.toBeLoaded()
  console.log('To be loaded: ', toBeLoaded)

  let resultSet: GeoJSONWithTrackId[]
  if (toBeLoaded.length > 0) {
    resultSet = await getGeoJson(toBeLoaded, props.sid)
  } else {
    resultSet = []
  }

  // Tracks in managed map do not really have an order. But for some styling scenarios we want tracks ordered by date. 
  // This is a dirty hack to maintain an order for the tracks newly added to mmap. This hack will not maintain overall track order when tracks
  // are loaded in chunks/batches

  const tmpList = resultSet.map((result) => {
    return {
      track: trackBag.getTrackById(result.id),
      geojson: result.geojson
    }
  })

  tmpList.sort((a, b) => {
    return a.track.secondsSinceEpoch() - b.track.secondsSinceEpoch()
  })

  tmpList.forEach(ele => {
    mmap.addTrackLayer(ele)
  })

  // B: tracks to hide
  const toHide = tvm.toBeHidden()
  console.log('To be hidden: ', toHide)
  _.forEach(toHide, function (id) { mmap.setInvisible(id) })

  if (zoomOut) {
    mmap.setExtentAndZoomOut()
  }
}

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
