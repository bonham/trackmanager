<template>
  <div>
    <div>Map with parameter {{ trackId }}</div>
    <div id="mapdiv" />
  </div>
</template>

<script>
import { Map, View } from 'ol'
import { transformExtent } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Stroke, Style } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
import { Track } from '@/lib/Track.js'

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

  setMapViewAndDrawTrack(this.trackId, map)
}

function setTarget () {
  this.map.setTarget('mapdiv')
}

// function zoomBoundingBox() {

// }

function setMapViewAndDrawTrack (tid, map) {
  const url = '/api/tracks/' + tid
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const track = new Track(data)

      // zoom to bbox
      const extent = transformExtent(
        track.geojson.bbox,
        'EPSG:4326',
        'EPSG:3857'
      )

      const mapSize = map.getSize()
      const view = map.getView()

      view.fit(
        extent,
        mapSize
      )

      // load track
      const style = new Style({
        stroke: new Stroke({
          color: 'brown',
          width: 2
        })
      })

      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(
          track.geojson,
          {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }
        )
      })
      // console.log('vsource: ' + vectorSource.getExtent())

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: style
      })

      map.addLayer(vectorLayer)

      // zoom a bit out
      const scale = 0.97
      view.animate(
        { zoom: view.getZoom() * scale })
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
