<template>
  <div>
    <TrackSection
      v-for="trCol in trackCollections"
      :key="trCol.year"
      :coll="trCol.collection"
      :label="trCol.year"
      :collapsed="isYearCollapsed(trCol.year)"
    />
  </div>
</template>

<script>
import { TrackCollection } from '@/lib/Track.js'
import { getAllTracks } from '@/lib/trackServices.js'
import TrackSection from '@/components/TrackSection.vue'
const collection = require('lodash/collection')

export default {
  name: 'TrackOverview',
  components: {
    TrackSection
    // TrackSection: () => import(/* webpackChunkName: "TrackSection" */ '@/components/TrackSection.vue')
  },
  data () {
    return {
      trackCollections: []
    }
  },
  created: async function () {
    const allTracks = await getAllTracks()
    const tracksByYear = collection.groupBy(allTracks, x => x.year())
    const yearList = Object.keys(tracksByYear)
    yearList.sort().reverse()
    this.yearList = yearList

    yearList.forEach(y => {
      const tc = new TrackCollection(tracksByYear[y])
      this.trackCollections.push({
        year: y,
        collection: tc
      })
    })
  },
  methods: {
    isYearCollapsed: function (thisYear) {
      const firstYearInCollection = this.trackCollections[0].year
      return thisYear !== firstYearInCollection
    }
  }
}
</script>
