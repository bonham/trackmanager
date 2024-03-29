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
import type { GeoJsonObject } from 'geojson'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers'
import { getGeoJson, getTracksByExtent, getTracksByYear, getTrackById, getAllTracks } from '@/lib/trackServices'
import _ from 'lodash'
import { useConfigStore } from '@/stores/configstore'
import { useMapStateStore } from '@/stores/mapstate'
import { useTrackStore } from '@/stores/trackStore'
import { StyleFactoryFixedColors } from '@/lib/mapStyles';
import type { Track } from '@/lib/Track'

const props = defineProps({
  sid: {
    type: String,
    required: true
  }
})

const mapStateStore = useMapStateStore()
const trackStore = useTrackStore()
const configStore = useConfigStore()

// reactive data
const popupdiv = ref<(null | HTMLElement)>(null) // template ref
const loading = ref(false)
const mmap = ref<null | ManagedMap>(null)


// create map object
// the callbackfunction is to react on 'select' events - e.g. setting data in a store or send events.
mmap.value = new ManagedMap()

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

    if (command.command === 'all') {

      console.log(`received all command`)
      await loadAllTracks()
      await redrawTracks(!!command.zoomOut)

    } else if (command.command === 'year') {

      const year = command.payload
      console.log(`received year command ${year}`)
      await loadTracksOfYear(year)
      await redrawTracks(!!command.zoomOut)

    } else if (command.command === 'bbox') {

      if (command.completed) { return }

      console.log("Received request to update extent")
      const map = mmap.value as ManagedMap
      const bbox = map.getMapViewBbox()
      const tracks = await getTracksByExtent(bbox, props.sid)
      console.log("tracks from extent call", tracks)
      trackStore.setLoadedTracks(tracks)
      await redrawTracks(!!command.zoomOut)

      command.completed = true

    } else if (command.command === 'track') {
      const id = command.payload
      await loadSingleTrack(id)
      await redrawTracks(!!command.zoomOut)
    }
  }
)

async function loadAllTracks() {
  const sid = props.sid
  try {
    loading.value = true
    const tracks = await getAllTracks(sid)
    trackStore.setLoadedTracks(tracks)
  } catch (e) {
    console.error('Error loading tracks by year', e)
  } finally {
    loading.value = false
  }
}

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

async function loadSingleTrack(trackId: number) {

  const sid = props.sid
  try {
    loading.value = true
    const track = await getTrackById(trackId, sid)
    if (track === null) {
      throw new Error(`Track is null for id ${trackId}`)
    } else {
      trackStore.setLoadedTracks([track])
    }
  } catch (e) {
    console.error('Error loading track', e)
  } finally {
    loading.value = false
  }
}

// method is redrawing tracks AND resetting selection ! 
// ( the latter might need to be factored out)
async function redrawTracks(zoomOut = false) {
  loading.value = true
  if (mmap.value === null) {
    console.error("mmap not initalized")
    return
  }
  const mm = mmap.value

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
    mmap.value.setStyleFactory(tStyle)
  } else {
    throw Error(`Unknown TRACKSTYLE config value ${TRACKSTYLE}`)
  }

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

  // Tracks in managed map do not really have an order. But for some styling scenarios we want tracks ordered by date. 
  // This is a dirty hack to maintain an order for the tracks newly added to mmap. This hack will not maintain overall track order when tracks
  // are loaded in chunks/batches

  const tmpList: { track: Track, geojson: GeoJsonObject }[] = resultSet.map((result) => {
    return {
      track: trackStore.tracksById[result.id],
      geojson: result.geojson
    }
  })

  tmpList.sort((a, b) => {
    return a.track.secondsSinceEpoch() - b.track.secondsSinceEpoch()
  })

  tmpList.forEach(ele => {
    mm.addTrackLayer(ele)
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
