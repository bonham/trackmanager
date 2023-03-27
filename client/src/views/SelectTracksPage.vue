<template>
  <b-container id="root" class="d-flex flex-column vh-100">
    <track-manager-nav-bar :sid="sid" />
    <div v-if="buttonsLoading" class="year-navbar">
      <b-button class="m-2">
        <b-skeleton width="3rem" />
      </b-button>
      <b-button class="m-2">
        <b-skeleton width="3rem" />
      </b-button>
      <b-button class="m-2">
        <b-skeleton width="3rem" />
      </b-button>
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
import { BContainer, BButton, BSkeleton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredMap from '@/components/FilteredMap.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices'
import { mapActions, mapState } from 'vuex'

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar,
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
    this.currentOrientation = 'landscape'
    this.buttonsLoading = true
    await this.getYears()
    this.buttonsLoading = false
    if (this.years.length > 0) {
      await this.loadTracksOfYear(this.years[0])
    }
  },

  methods: {
    ...mapActions([
      'loadTracksAndRedraw'
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
      this.loadTracksAndRedraw(loadFunction).catch(e => console.error('Error loading tracks by year', e))
    },
    loadAllTracks: function () {
      const sid = this.sid
      const loadFunc = () => getAllTracks(sid)
      this.loadTracksAndRedraw(loadFunc).catch(e => console.error('Error loading all tracks', e))
    },
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
