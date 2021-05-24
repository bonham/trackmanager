<template>
  <div>
    <div>Map with parameter {{ trackId }}</div>
    <div id="mapdiv" />
  </div>
</template>

<script>
import { Map, View } from 'ol'
import { transformExtent } from 'ol/proj'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import Track from '@/lib/Track.js'

function initMap () {
// eslint-disable-next-line no-unused-vars
  const map = new Map({
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
  this.map = map

  getTrack(this.trackId, map)
}

function setTarget () {
  this.map.setTarget('mapdiv')
}

// function zoomBoundingBox() {

// }

function getTrack (tid, map) {
  const url = '/api/tracks/' + tid
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const track = new Track(data)
      const extent = transformExtent(
        track.geojson.bbox,
        'EPSG:4326',
        'EPSG:3857'
      )

      map.getView().fit(
        extent,
        map.getSize()
      )
    })
}

export default {
  name: 'MapComponent',
  props: {
    trackId: {
      type: Number,
      required: true
    }
  },
  data () {
    return {
      map: null
    }
  },
  created: initMap,
  mounted: setTarget
}

</script>

<style>
  #mapdiv {
    width: 700px;
    height: 650px;
  }
  @import '../../node_modules/ol/ol.css'

</style>
