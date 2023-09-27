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
import { getGeoJson } from '@/lib/trackServices'
import _ from 'lodash'

import { useTracksStore } from '@/storepinia'
const store = useTracksStore()

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
async function redrawTracks() {
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
    store.getLoadedTrackIds,
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
    const tr = store.tracksById[result.id]
    mm.addTrackLayer({ track: tr, geojson: result.geojson })
  })

  // B: tracks to hide
  const toHide = tvm.toBeHidden()
  console.log('To be hidden: ', toHide)
  _.forEach(toHide, function (id) { mm.setInvisible(id) })

  loading.value = false
  mm.setExtentAndZoomOut()
}


// watch if the viewport is resized and resize the map
watch(
  () => store.resizeMap,

  (newValue, oldValue) => {
    if (newValue === true) {
      if (oldValue === true) {
        console.log('Triggered watch of updateSize while update was running')
      }
      if (mmap.value) {
        mmap.value.map.updateSize()
        store.resizeMap = false
      } else {
        console.error("mmap was not initialized")
      }
    }
  }
)
// watch for a command in store to redraw the tracks on the map
watch(
  () => store.redrawTracksOnMap,
  async (newValue, oldValue) => {
    if (newValue === true) {
      if (oldValue === true) {
        console.log('Warn: Triggering redrawTracks watch while a redraw is running')
      }
      await redrawTracks()
      store.redrawTracksOnMap = false
    }
  }
)

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
