<template>
  <div id="mapdiv" label="Map" />
  <div ref="popupdiv"></div>
</template>

<script setup lang="ts">
import { getGeoJson, getTrackById } from '@/lib/trackServices'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import { ref, onMounted, nextTick } from 'vue'
import { getConfig } from '@/lib/getconfig';
import { StyleFactoryFixedColors } from '@/lib/mapStyles';

const props = defineProps({
  trackId: {
    type: Number,
    required: true
  },
  sid: {
    type: String,
    default: ''
  }
})

const TRACKSTYLE = await getConfig(props.sid, 'SCHEMA', 'TRACKSTYLE', 'THREE_BROWN')

const mmap = ref<null | ManagedMap>(null)

mmap.value = new ManagedMap()
if (TRACKSTYLE === 'THREE_BROWN') {
  // all good
} else if (TRACKSTYLE === 'FIVE_COLORFUL') {
  const tStyle = new StyleFactoryFixedColors([
    '#ffa500',
    '#a52a2a',
    '#ff0000',
    '#008000',
    '#0000ff',
  ])
  mmap.value.setStyleFactory(tStyle)
} else {
  throw Error(`Unknown TRACKSTYLE config value ${TRACKSTYLE}`)
}

await drawTrack() // async

onMounted(() => {

  nextTick(() => {
    if (mmap.value === null) throw new Error("Managed map not initialized")
    mmap.value.map.setTarget('mapdiv')
    const popupDiv = ref<HTMLInputElement | null>(null)
    if (popupDiv.value === null) {
      throw new Error("Unexpected: popup div is null ?")
    } else {
      mmap.value.initPopup(popupDiv.value)
      console.log("map mounted")
    }
  }).catch(console.error)
})

async function drawTrack() {
  if (mmap.value === null) {
    console.error("No map found")
    return
  }
  const resultSet = await getGeoJson([props.trackId], props.sid)
  const result = resultSet[0]
  const track = await getTrackById(props.trackId, props.sid)
  if (track === null) {
    console.error(`Could not get track with id ${props.trackId}`)
  } else {
    mmap.value.addTrackLayer({ geojson: result.geojson, track: track })
    mmap.value.setExtentAndZoomOut()
  }
}

</script>

<style>
@import '../../node_modules/ol/ol.css';

#mapdiv {
  width: 100%;
  height: 100%;
}

.map-control-expand {
  top: 4em;
  left: .5em;
}

.popover-body {
  min-width: 276px;
}
</style>
