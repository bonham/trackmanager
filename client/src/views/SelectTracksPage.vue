<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar :sid="sid" />
    <div>
      <b-button
        v-for="year in years"
        :key="year"
        class="m-2"
        @click="loadComplete(year)"
      >
        {{ year }}
      </b-button>
      <b-button
        class="m-2"
        @click="loadComplete(2020)"
      >
        2020
      </b-button>
      <b-button
        class="m-2"
        @click="loadAllTracks()"
      >
        All
      </b-button>
      <b-button
        class="m-2"
        @click="clearTracks()"
      >
        None
      </b-button>
      <b-button
        class="m-2"
        @click="setLayout(currentOrientation === 'portrait' ? 'landscape' : 'portrait')"
      >
        Orientation
      </b-button>
    </div>
    <div
      ref="outerSplitFrame"
      class="split flex-grow-1 d-flex  minheight-0"
      :class="[flexBoxFlowClass]"
    >
      <div
        id="leftpanel"
        class="overflow-auto minheight-0"
      >
        <filtered-track-list />
      </div>

      <div
        id="rightpanel"
        class="d-flex"
      >
        <filtered-map />
      </div>
    </div>
  </b-container>
</template>

<script>
import { BContainer, BButton } from 'bootstrap-vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '@/components/FilteredTrackList.vue'
import FilteredMap from '@/components/FilteredMap.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices.js'
import { mapActions, mapState, mapMutations } from 'vuex'
import Split from 'split.js'
const _ = require('lodash')

function getViewPortOrientation () {
  const mediaQueryString = '(orientation: portrait)'
  const mqList = window.matchMedia(mediaQueryString)
  const orientation = mqList.matches ? 'portrait' : 'landscape'
  return orientation
}

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar,
    FilteredTrackList,
    FilteredMap,
    BContainer,
    BButton
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      currentOrientation: 'landscape',
      resizeObserver: null,
      years: []
    }
  },
  computed: {
    ...mapState([
      'loadedTracks'
    ]),
    flexBoxFlowClass () {
      return this.currentOrientation === 'portrait' ? 'flex-column' : 'flex-row'
    },
    splitDirectionOption () {
      return this.currentOrientation === 'portrait' ? 'vertical' : 'horizontal'
    }

  },
  created () {
    this.currentOrientation = getViewPortOrientation()
    this.getYears()
  },
  beforeDestroy () {
    this.resizeObserver.unobserve(this.$refs.outerSplitFrame)
  },
  mounted: function () {
    // split should definitely run before the map is attached to the div
    // so when map is run through nextTick - then let's not run split in nexttick - otherwise
    // it runs to early and map is not correctly rendered
    this.split = Split(['#leftpanel', '#rightpanel'], {
      onDragEnd: this.resizeMapFlag,
      direction: this.splitDirectionOption
    })
    // observe if window aspect is changing, then call setLayout
    const debouncedOnResize = _.debounce(
      this.onResize,
      300
    )
    this.resizeObserver = new ResizeObserver(debouncedOnResize)
    this.resizeObserver.observe(this.$refs.outerSplitFrame)
  },
  methods: {
    ...mapActions([
      'loadTracks',
      'clearTracks'
    ]),
    ...mapMutations([
      // indicate the map that it needs a resize
      'resizeMapFlag'
    ]),

    getYears () {
      getAllTracks().then((trackList) => {
        const tColl = new TrackCollection(trackList)
        this.years = tColl.yearList().sort((a, b) => b - a)
      })
    },

    loadComplete: function (year) {
    // call loadTracks action from store while injecting the load function
      const sid = this.sid
      const loadFunction = function () { return getTracksByYear(year, sid) }
      this.loadTracks(loadFunction).catch(e => console.error('Error loading tracks by year', e))
    },
    loadAllTracks: function () {
      this.loadTracks(getAllTracks).catch(e => console.error('Error loading all tracks', e))
    },
    setLayout (wantedOrientation) {
      if (wantedOrientation === this.currentOrientation) {
        return
      }
      // destroy the managed split
      this.split.destroy()
      // change flex layout
      this.currentOrientation = wantedOrientation
      // create new split
      this.split = Split(['#leftpanel', '#rightpanel'], {
        onDragEnd: this.resizeMapFlag,
        direction: this.splitDirectionOption
      })
      // resize map
      this.resizeMapFlag()
    },
    onResize () {
      console.log('resize1')
      this.setLayout(getViewPortOrientation())
    }
  }
}
</script>
<style scoped>

/* Needed for vertical overflow: scroll in flexbox container */
.minheight-0 {
  min-height: 0;
}
</style>
<style>

/* Split.js css entries can not reside in scoped style section */
.gutter {
    background-color: rgb(255, 255, 255);
    background-repeat: no-repeat;
    background-position: 50%;
}

.gutter.gutter-horizontal {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
    cursor: col-resize;
}

.gutter.gutter-vertical {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAFAQMAAABo7865AAAABlBMVEVHcEzMzMzyAv2sAAAAAXRSTlMAQObYZgAAABBJREFUeF5jOAMEEAIEEFwAn3kMwcB6I2AAAAAASUVORK5CYII=');
    cursor: row-resize;
}

</style>
