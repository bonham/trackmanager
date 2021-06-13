<template>
  <div>
    <TrackSection
      v-for="trCol in trackCollections"
      :key="trCol.year"
      :coll="trCol.collection"
      :label="trCol.year"
    />
  </div>
</template>

<script>
import { Track, TrackCollection } from '@/lib/Track.js'
import TrackSection from '@/components/TrackSection.vue'

export default {
  name: 'TrackOverview',
  components: { TrackSection },
  data () {
    return {
      trackCollections: []
    }
  },
  created: function () {
    fetch('/api/tracks')
      .then(response => response.json())
      .then(data => {
        const tracksByYear = {}

        // create tracks and separate by year
        data.forEach(element => {
          const track = new Track(element)
          const year = track.time.year // luxon datetime obj
          tracksByYear[year] = (tracksByYear[year] || [])
          tracksByYear[year].push(track)
        })

        // loop over years, create TrackCollections and push to reactive property
        const yearList = Object.keys(tracksByYear)
        yearList.sort()
        this.yearList = yearList

        yearList.forEach(y => {
          const tc = new TrackCollection(tracksByYear[y])
          this.trackCollections.push({
            year: y,
            collection: tc
          })
        })
      })
  }
}
</script>
