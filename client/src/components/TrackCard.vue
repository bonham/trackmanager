<template>
  <b-card
    class="my-2"
  >
    <b-card-text>
      <b-row class="align-items-center">
        <b-col cols="8">
          <h4>
            {{ track.src }}
          </h4>
          <div>
            {{ track.monthAndDay() }}
            / {{ (track.distance() / 1000).toFixed(2) }} km
            / {{ Math.round(track.ascent) }} m
            / {{ track.timeLengthFormatted() }} h
          </div>
        </b-col>
        <b-col
          cols="4"
          class="text-end"
        >
          <b-icon-check-square class="mx-4 card-icon" />
          <b-link
            class="mx-4 card-icon"
            :to="'/track/'+track.id"
            router-tag="b-icon-zoom-in"
          />
        </b-col>
      </b-row>
    </b-card-text>
  </b-card>
</template>

<script>

import { Track } from '@/lib/Track.js'

export default {
  name: 'TrackCard',
  props: {
    track: {
      type: Track,
      default: null
    }
  }
}
</script>
<style scoped>
.card-icon {
  font-size: 3rem;
}
</style>
