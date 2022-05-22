<template>
  <div>
    <div>
      <span v-if="loading">Loading <b-spinner small />
      </span>
    </div>
    <div>
      <TrackSection
        v-for="trCol in trackCollections"
        :key="trCol.year"
        :coll="trCol.collection"
        :label="trCol.year === '0' ? 'No date' : trCol.year"
        :collapsed="isYearCollapsed(trCol.year)"
        :sid="sid"
      />
    </div>
  </div>
</template>

<script>
import { TrackCollection } from '@/lib/Track.js'
import { getAllTracks } from '@/lib/trackServices.js'
import TrackSection from '@/components/TrackSection.vue'
import { BSpinner } from 'bootstrap-vue'
const _ = require('lodash')

export default {
  name: 'TrackOverview',
  components: {
    BSpinner,
    TrackSection
    // TrackSection: () => import(/* webpackChunkName: "TrackSection" */ '@/components/TrackSection.vue')
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
    tracksByYear () {
      // object to array:
      const trackFlatList = _.values(this.loadedTracks)
      return _.groupBy(trackFlatList, x => x.year())
    },
    yearList () {
      const yearList = _.keys(this.tracksByYear)
      yearList.sort().reverse()
      return yearList
    },
    trackCollections () {
      const r = []
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
    isYearCollapsed (thisYear) {
      const firstYearInCollection = this.trackCollections[0].year
      return thisYear !== firstYearInCollection
    }
  }
}
</script>
