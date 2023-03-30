<template>
  <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
    <div id="mapdiv" class="flex-grow-1 d-flex flex-column justify-content-center align-items-center" />
    <div v-if="loading" class="mapspinner">
      <b-spinner />
    </div>
    <div ref="popupdiv"></div>
  </div>
</template>
<script lang="ts">
import { BSpinner } from 'bootstrap-vue-next'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import type { GeoJSONWithTrackId } from '@/lib/mapservices/ManagedMap'
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
  data() {
    return {
      loading: false,
      mmap: null as (null | ManagedMap)
    }
  },
  computed: {
    ...mapGetters({
      shouldBeVisibleIds: 'getLoadedTrackIds',
      getTrackById: 'getTrackById'
    })
  },
  created() {
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
      async (newValue, oldValue) => {
        if (newValue === true) {
          if (oldValue === true) {
            console.log('Warn: Triggering redrawTracks watch while a redraw is running')
          }
          await boundRedrawTracks()
          this.redrawTracksOnMapFlag(false)
        }
      }
    )

    // watch for a command in store
    // Select / deselect events can be transmitted
    // after completion of the action, the 'selectionForMap'
    // will be cleared
    this.$watch(
      () => {
        return this.$store.state.selectionForMap
      },
      async (selectionUpdateObj) => {
        if (this.mmap === null) {
          console.error("mmap not initalized")
          return
        }
        if (selectionUpdateObj !== null) {
          const selectedTrackids = selectionUpdateObj.selected
          await this.mmap.setSelectedTracks(selectedTrackids)
          await this.clearSelectionForMap()
          setTimeout(
            (this.mmap.setExtentAndZoomOut).bind(this.mmap),
            1
          )
        }
      }
    )
  },
  mounted() {
    this.$nextTick(() => {
      if (this.mmap === null) {
        console.error("mmap not initalized")
        return
      }
      this.mmap.map.setTarget('mapdiv')
      const popupDiv = this.$refs.popupdiv as HTMLElement
      this.mmap.initPopup(popupDiv)
    })
  },
  methods: {
    redrawTracks: async function () {
      this.loading = true
      if (this.mmap === null) {
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

      let resultSet: GeoJSONWithTrackId[]
      if (toBeLoaded.length > 0) {
        resultSet = await getGeoJson(toBeLoaded, this.sid)
      } else {
        resultSet = []
      }
      resultSet.forEach(result => {
        const tr = this.getTrackById(result.id)
        mmap.addTrackLayer({ track: tr, geojson: result.geojson })
      })

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
