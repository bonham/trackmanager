<template>
  <b-container id="root" class="d-flex flex-column">
    <track-manager-nav-bar :sid="sid" />
    <div v-if="buttonsLoading" class="placeholder-glow d-flex flex-row" style="width: 20em;">
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
    </div>
    <div v-else class="year-navbar">
      <b-button v-for="year in years" :key="year" class="m-2 button-year-navbar" @click="loadTracksOfYear(year)">
        {{ year === 0 ? "No date" : year }}
      </b-button>
      <b-button v-if="showAllButton" class="m-2 button-year-navbar" @click="loadAllTracks()">
        All
      </b-button>
    </div>
    <div ref="outerSplitFrame" class="flex-grow-1 flex-column d-flex">
      <filtered-track-list />
    </div>
  </b-container>
</template>

<script lang="ts">
import { BContainer, BButton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '@/components/FilteredTrackList.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices'
import { mapActions, mapState } from 'vuex'

export default {
  name: 'TrackListPage',
  components: {
    TrackManagerNavBar,
    FilteredTrackList,
    BContainer,
    BButton,
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      years: [] as number[],
      buttonsLoading: false,
      showAllButton: false,
      currentOrientation: null as (null | "landscape" | "portrait ")
    }
  },
  computed: {
    ...mapState([
      'loadedTracks'
    ])
  },
  async created() {
    this.buttonsLoading = true
    await this.getYears()
    this.buttonsLoading = false
    if (this.years.length > 0) {
      await this.loadTracksOfYear(this.years[0])
    }
  },

  methods: {
    ...mapActions([
      'loadTracks'
    ]),

    async getYears() {
      await getAllTracks(this.sid).then((trackList) => {
        const tColl = new TrackCollection(trackList)
        this.years = tColl.yearList().sort((a, b) => b - a)
      })
    },

    loadTracksOfYear: function (year: number) {
      // call loadTracksAndRedraw action from store while injecting the load function
      const sid = this.sid
      const loadFunction = function () { return getTracksByYear(year, sid) }
      this.loadTracks(loadFunction).catch(e => console.error('Error loading tracks by year', e))
    },
    loadAllTracks: function () {
      const sid = this.sid
      const loadFunc = () => getAllTracks(sid)
      this.loadTracks(loadFunc).catch(e => console.error('Error loading all tracks', e))
    }
  }
}
</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}
</style>
