<template>
  <b-container
    id="root"
    class="d-flex flex-column"
  >
    <track-manager-nav-bar :sid="sid" />
    <div
      v-if="buttonsLoading"
      class="year-navbar"
    >
      <b-button
        class="m-2"
      >
        <b-skeleton width="3rem" />
      </b-button>
      <b-button
        class="m-2"
      >
        <b-skeleton width="3rem" />
      </b-button>
      <b-button
        class="m-2"
      >
        <b-skeleton width="3rem" />
      </b-button>
    </div>
    <div
      v-else
      class="year-navbar"
    >
      <b-button
        v-for="year in years"
        :key="year"
        class="m-2 button-year-navbar"
        @click="loadTracksOfYear(year)"
      >
        {{ year === 0 ? "No date" : year }}
      </b-button>
      <b-button
        v-if="showAllButton"
        class="m-2 button-year-navbar"
        @click="loadAllTracks()"
      >
        All
      </b-button>
    </div>
    <div
      ref="outerSplitFrame"
      class="flex-grow-1 flex-column d-flex"
    >
      <div
        class="d-flex p-2"
        style="height: 40vh;"
      >
        <filtered-map :sid="sid" />
      </div>
      <filtered-track-list />
    </div>
  </b-container>
</template>

<script>
import { BContainer, BButton, BSkeleton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '@/components/FilteredTrackList.vue'
import FilteredMap from '@/components/FilteredMap.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices'
import { mapActions, mapState, mapMutations } from 'vuex'
import _ from 'lodash'

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar,
    FilteredTrackList,
    FilteredMap,
    BContainer,
    BButton,
    BSkeleton
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      resizeObserver: null,
      years: [],
      buttonsLoading: false,
      showAllButton: false
    }
  },
  computed: {
    ...mapState([
      'loadedTracks'
    ])
  },
  async created () {
    this.currentOrientation = 'landscape'
    this.buttonsLoading = true
    await this.getYears()
    this.buttonsLoading = false
    if (this.years.length > 0) {
      await this.loadTracksOfYear(this.years[0])
    }
  },
  beforeUnmount () {
    this.resizeObserver.unobserve(this.$refs.outerSplitFrame)
  },
  mounted: function () {
    // split should definitely run before the map is attached to the div
    // so when map is run through nextTick - then let's not run split in nexttick - otherwise
    // it runs to early and map is not correctly rendered
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
      'loadTracksAndRedraw'
    ]),
    ...mapMutations([
      // indicate the map that it needs a resize
      'resizeMapFlag'
    ]),

    async getYears () {
      await getAllTracks(this.sid).then((trackList) => {
        const tColl = new TrackCollection(trackList)
        this.years = tColl.yearList().sort((a, b) => b - a)
      })
    },

    loadTracksOfYear: function (year) {
    // call loadTracksAndRedraw action from store while injecting the load function
      const sid = this.sid
      const loadFunction = function () { return getTracksByYear(year, sid) }
      this.loadTracksAndRedraw(loadFunction).catch(e => console.error('Error loading tracks by year', e))
    },
    loadAllTracks: function () {
      const sid = this.sid
      const loadFunc = () => getAllTracks(sid)
      this.loadTracksAndRedraw(loadFunc).catch(e => console.error('Error loading all tracks', e))
    },
    onResize () {
      console.log('resize1')
      this.resizeMapFlag()
    }
  }
}
</script>
<style>

.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}

.year-navbar {
  display: flex;
  flex-flow: row nowrap;
  overflow: auto;
  flex: 0 0 auto;
  align-content: center;
}

</style>
