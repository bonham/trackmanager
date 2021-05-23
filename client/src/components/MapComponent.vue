<template>
  <div id="mapdiv" />
</template>

<script>
import { Map, View } from 'ol'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'

function initMap () {
// eslint-disable-next-line no-unused-vars
  const map = new Map({
    target: 'mapdiv',
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: [0, 0],
      zoom: 0
    })
  })
}

export default {
  name: 'MapComponent',
  data () {
    return {
      dummy: []
    }
  },
  mounted: initMap
}

</script>

<style>
  #mapdiv {
    width: 700px;
    height: 650px;
  }
  @import '../../node_modules/ol/ol.css'

</style>
