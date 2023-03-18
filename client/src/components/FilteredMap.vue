<template>
  <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center min-vh-100">
    <div
      id="mapdiv"
      class="flex-grow-1 d-flex flex-column justify-content-center align-items-center min-vh-100"
    />
    <div
      v-if="loading"
      class="mapspinner"
    >
      <b-spinner />
    </div>
  </div>
</template>
<script lang="ts">
import { BSpinner } from 'bootstrap-vue-next'
import { ManagedMap } from '@/lib/mapServices'
import { TrackVisibilityManager } from '@/lib/mapStateHelpers'
import { getGeoJson } from '@/lib/trackServices'
import { mapMutations, mapGetters } from 'vuex'
import _ from 'lodash'

export default {
  name: 'FilteredMap',
  components: {
    BSpinner
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      loading: false,
      mmap: null
    } as { loading: boolean;  mmap: ManagedMap | null }
  },
  computed: {
    ...mapGetters({
      shouldBeVisibleIds: 'getLoadedTrackIds'
    })
  },
  created () {
    // create map object
    this.mmap = new ManagedMap({ selectCallBackFn: (this.updateSelectionForList).bind(this) })

    // watch if the viewport is resized and resize the map
    this.$watch(
       () => {
        return this.$store.state.resizeMap
      },
      (newValue, oldValue) => {
        if (newValue === true) {
          if (oldValue === true) {
            console.log('Triggered watch of updateSize while update was running')
          }
          if (this.mmap) {
            this.mmap.map.updateSize()
            this.resizeMapClear()
          } else {
            console.error("mmap was not initialized")
          }
        }
      }
    )
    // watch if tracks are loaded and should be drawn
    const unboundRedrawTracks = this.redrawTracks
    const boundRedrawTracks = unboundRedrawTracks.bind(this)
    this.$watch(
       () => {
        return this.$store.state.redrawTracksOnMap
      },
      async  (newValue, oldValue) => {
        if (newValue === true) {
          if (oldValue === true) {
            console.log('Warn: Triggering redrawTracks watch while a redraw is running')
          }
          await boundRedrawTracks()
          this.redrawTracksOnMapFlag(false)
        }
      }
    )
    // watch for selected tracks
    this.$watch(
       () => {
        return this.$store.state.selectionForMap
      },
      async (selectionUpdateObj) => {
        if(this.mmap === null ) {
          console.error("mmap not initalized")
          return
        }
        if (selectionUpdateObj !== null) {
          await this.mmap.setSelectedTracks(selectionUpdateObj)
          await this.clearSelectionForMap()
          setTimeout(
            (this.mmap.setExtentAndZoomOut).bind(this.mmap),
            1
          )
        }
      }
    )
  },
  mounted () {
    this.$nextTick(() => {
      if(this.mmap === null ) {
          console.error("mmap not initalized")
          return
      }
      this.mmap.map.setTarget('mapdiv')
    })
  },
  methods: {
    redrawTracks: async function () {
      this.loading = true
      if(this.mmap === null ) {
          console.error("mmap not initalized")
          return
      }
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
      
      let resultSet :any[] // TODO explicit type
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

      this.loading = false
      this.mmap.setExtentAndZoomOut()
    },
    ...mapMutations([
      'resizeMapClear',
      'redrawTracksOnMapFlag',
      'doZoomToExtent',
      'updateSelectionForList',
      'clearSelectionForMap'
    ])
  }
}

</script>

<style>
@import '../../node_modules/ol/ol.css';
#mapdiv {
  width: 100%; /* needed - otherwise map does not show */
  flex-grow: 1; /* maybe not needed */
  height: 1em; /* needed - otherwise map does not show */
}
.map-control-expand {
  top: 4em;
  left: .5em;
}
.mapspinner {
  position: absolute;
}

</style>
