<template>
  <b-row>
    <b-col>
      <div class="px-3 py-3 pt-md-5 pb-md-4 mx-auto">
        <div>
          <b-card
            v-for="item in myDataList"
            :key="item.id"
            bg-variant="light"
            border-variant="secondary"
            :title="item.src"
            class="my-2"
          >
            <b-card-text>
              {{ Math.round(item.length / 1000) }} km
              / {{ Math.round(item.ascent) }} m
              / {{ item.timeLengthFormatted() }} h
            </b-card-text>
          </b-card>
        </div>
      </div>
    </b-col>
  </b-row>
</template>

<script>
import Track from '@/lib/Track.js'
export default {
  name: 'TrackList',
  data () {
    return {
      myDataList: ['x']
    }
  },

  created: function () {
    fetch('/tracks')
      .then(response => response.json())
      .then(data => {
        this.myDataList = data.map(e => { return new Track(e) })
      })
  }
}
</script>
