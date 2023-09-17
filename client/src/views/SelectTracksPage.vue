<template>
  <b-container id="root" class="d-flex flex-column vh-100">
    <track-manager-nav-bar :sid="sid" />
    <!-- <div v-if="buttonsLoading" class="year-navbar"> -->
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
    <div class="d-flex flex-column flex-grow-1">
      <filtered-map :sid="sid" />
    </div>
  </b-container>
</template>

<script lang="ts">
import { BContainer, BButton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredMap from '@/components/FilteredMap.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices'
import { useTracksStore } from '@/storepinia'
const store = useTracksStore()

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar,
    FilteredMap,
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

  async created() {
    this.currentOrientation = 'landscape'
    this.buttonsLoading = true
    await this.getYears()
    this.buttonsLoading = false
    if (this.years.length > 0) {
      await this.loadTracksOfYear(this.years[0])
    }
  },

  methods: {


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
      store.loadTracksAndRedraw(loadFunction).catch((e: any) => console.error('Error loading tracks by year', e))
    },
    loadAllTracks: function () {
      const sid = this.sid
      const loadFunc = () => getAllTracks(sid)
      store.loadTracksAndRedraw(loadFunc).catch((e: any) => console.error('Error loading all tracks', e))
    },
  }
}
</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}
</style>
