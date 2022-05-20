<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div
      id="mapdiv"
    />
  </div>
</template>
<script>
import { ManagedMap } from '@/lib/mapServices.js'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers.js'
import { getGeoJson } from '@/lib/trackServices.js'
import { mapMutations, mapGetters, mapActions } from 'vuex'
const _ = require('lodash')

export default {
  name: 'FilteredMap',
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      drawnOnce: false
    }
  },
  computed: {
    ...mapGetters({
      shouldBeVisibleIds: 'getLoadedTrackIds'
    })
  },
  created () {
    // create map object
    this.mmap = new ManagedMap({ selectCallBackFn: this.selectTrackAndScroll })

    // watch if the viewport is resized and resize the map
    this.$watch(
      function (state) {
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
    this.$watch(
      function (state) {
        return this.$store.state.redrawTracksOnMap
      },
      function () {
        boundRedrawTracks()
      }
    )
    // watch for selected tracks
    this.$watch(
      function (state) {
        return this.$store.state.selectedTrack
      },
      function (trackIdNew) {
        this.mmap.setSelectedTrack(trackIdNew)
      }
    )
  },
  mounted () {
    this.$nextTick(() => {
      this.mmap.map.setTarget('mapdiv')
      this.mmap.zoomOut()
    })
  },
  methods: {
    redrawTracks: async function () {
      const mmap = this.mmap
      const tvm = new TrackVisibilityManager(
        mmap.getTrackIdsVisible(),
        this.shouldBeVisibleIds,
        mmap.getTrackIds()
      )

      // A1: set existing visible
      const toggleIds = tvm.toggleToVisible()
      console.log('Toggle: ', toggleIds)
      _.forEach(toggleIds, function (id) { mmap.setVisible(id) })

      // A2: load missing and add vector layer to map
      const toBeLoaded = tvm.toBeLoaded()
      console.log('To be loaded: ', toBeLoaded)
      let resultSet
      if (toBeLoaded.length > 0) {
        resultSet = await getGeoJson(toBeLoaded, this.sid)
      } else {
        resultSet = []
      }
      resultSet.forEach(result => { mmap.addTrackLayer(result) })

      // B: tracks to hide
      const toHide = tvm.toBeHidden()
      console.log('To be hidden: ', toHide)
      _.forEach(toHide, function (id) { mmap.setInvisible(id) })

      if (!this.drawnOnce) {
        this.mmap.setExtentAndZoomOut()
        this.drawnOnce = true
      }
    },
    ...mapMutations([
      'resizeMapClear',
      'redrawTracksOnMapFlag'
    ]),
    ...mapActions([
      'selectTrackAndScroll'
    ])
  }
}

</script>

<style>
#mapdiv {
  width: 100%;
  height: 100%;
}
.map-control-expand {
  top: 4em;
  left: .5em;
}

  @import '../../node_modules/ol/ol.css'

</style>
