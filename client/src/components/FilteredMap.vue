<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div
      id="mapdiv"
    />
  </div>
</template>
<script>
import { ManagedMap, GeoJsonCollection } from '@/lib/mapServices.js'
import { getGeoJson } from '@/lib/trackServices.js'
import { mapMutations, mapState } from 'vuex'
const _ = require('lodash')

export default {
  name: 'FilteredMap',
  created () {
    // create map object
    this.initMap()

    // watch if the viewport is resized and resize the map
    this.$store.watch(
      (state) => {
        return this.$store.state.resizeMap
      },
      (newValue, oldValue) => {
        if (newValue === true) {
          this.mmap.map.updateSize()
          this.resizeMapClear()
        }
      }
    )
    // watch if tracks are loaded and should be drawn
    // const f = this.redrawTracks
    const unboundRedrawTracks = this.redrawTracks
    const boundRedrawTracks = unboundRedrawTracks.bind(this)
    this.$store.watch(
      (state) => {
        return this.$store.state.redrawTracksOnMap
      },
      function (newValue, oldValue) {
        if (newValue === true) {
          boundRedrawTracks()
        }
      }
    )
  },
  mounted () {
    this.$nextTick(() => {
      this.setTarget()
    })
  },
  methods: {
    initMap: function () {
      this.mmap = new ManagedMap()
    },
    redrawTracks: async function () {
      const ids = _.map(this.loadedTracks(), (x) => { return x.id })
      const resultSet = await getGeoJson(ids)
      const geoJColl = new GeoJsonCollection(resultSet)
      const overallBbox = geoJColl.boundingBox()
      this.mmap.setMapView(overallBbox)
      this.mmap.zoomOut()
      resultSet.forEach(result => {
        const gj = result.geojson
        this.mmap.drawTrack(gj)
      })
      this.redrawTracksOnMapFlag(false)
    },
    setTarget: function () {
      this.mmap.map.setTarget('mapdiv')
      this.mmap.zoomOut()
    },
    ...mapMutations([
      'resizeMapClear',
      'redrawTracksOnMapFlag'
    ]),
    ...mapState([
      'loadedTracks'
    ])
  }
}

</script>

<style>
#mapdiv {
  width: 100%;
  height: 100%;
}
  @import '../../node_modules/ol/ol.css'

</style>
