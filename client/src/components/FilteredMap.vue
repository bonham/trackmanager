<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div
      id="mapdiv"
    />
  </div>
</template>
<script>
import { ManagedMap, ExtentCollection } from '@/lib/mapServices.js'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers.js'
import { getGeoJson } from '@/lib/trackServices.js'
import { mapMutations, mapState, mapGetters } from 'vuex'
const _ = require('lodash')

export default {
  name: 'FilteredMap',
  computed: {
    ...mapGetters({
      shouldBeVisibleIds: 'getLoadedTrackIds'
    })
  },
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
      const tvm = new TrackVisibilityManager(
        this.mmap.getLayerIdsVisible(),
        this.shouldBeVisibleIds
      )

      // A: tracks to make visible
      const toMakeVisible = tvm.deltaToBeEnabledIdList

      // A1: set existing visible
      const existingInvisible = this.mmap.getLayerIdsInVisible()
      const flipToVisible = _.intersection(Array.from(toMakeVisible), existingInvisible)
      _.forEach(flipToVisible, (id) => { this.mmap.setVisible(id) })

      // A2: load missing and add vector layer
      // eslint-disable-next-line no-unused-vars
      const toBeLoaded = _.difference(Array.from(toMakeVisible), existingInvisible)
      let resultSet
      if (toBeLoaded.length > 0) {
        resultSet = await getGeoJson(toBeLoaded)
      } else {
        resultSet = []
      }
      resultSet.forEach(result => { this.mmap.addTrackLayer(result) })

      // B: tracks to hide
      // eslint-disable-next-line no-unused-vars
      const toHide = tvm.toBeHiddenIdList
      _.forEach(toHide, (id) => { this.mmap.setInvisible(id) })

      // set extent and zoom out
      const visibleIds = this.mmap.getLayerIdsVisible()
      const extentList = _.map(visibleIds, (id) => {
        return this.mmap.getTrackLayer(id).getSource().getExtent()
      })
      const overallBbox = new ExtentCollection(extentList).boundingBox()
      console.log(overallBbox)
      this.mmap.setMapView(overallBbox)
      this.mmap.zoomOut()

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
