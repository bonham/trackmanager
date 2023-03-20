<template>
  <div>
    <div>
      <span v-if="loading">Loading <b-spinner small />
      </span>
    </div>
    <div>
      <TrackSection v-for="trCol in trackCollections" :key="trCol.year" :coll="trCol.collection"
        :label="trCol.year === '0' ? 'No date' : trCol.year" :collapsed="isYearCollapsed(trCol.year)" :sid="sid" />
    </div>
  </div>
</template>

<script lang="ts">
import { Track, TrackCollection } from '@/lib/Track'
import { getAllTracks } from '@/lib/trackServices'
import { BSpinner } from 'bootstrap-vue-next'
import _ from 'lodash'

export default {
  name: 'TrackOverview',
  components: {
    BSpinner,
    TrackSection: () => import('@/components/TrackSection.vue')
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data: function () {
    return {
      loadedTracks: [],
      loading: false
    }
  },
  computed: {
    tracksByYear() {
      // object to array:
      const trackFlatList = _.values(this.loadedTracks)
      return _.groupBy(trackFlatList, (x: Track) => x.year())
    },
    yearList() {
      const yearList = _.keys(this.tracksByYear)
      yearList.sort().reverse()
      return yearList
    },
    trackCollections() {
      const r: { year: string, collection: TrackCollection }[] = []
      this.yearList.forEach(y => {
        const tc = new TrackCollection(this.tracksByYear[y])
        r.push({
          year: y,
          collection: tc
        })
      })
      return r
    }
  },
  created: async function () {
    this.loading = true
    this.loadedTracks = await getAllTracks(this.sid)
    this.loading = false
  },
  methods: {
    isYearCollapsed(thisYear: string) {
      const firstYearInCollection = this.trackCollections[0].year
      return thisYear !== firstYearInCollection
    }
  }
}
</script>
