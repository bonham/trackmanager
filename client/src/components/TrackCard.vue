<template>
  <b-card
    bg-variant="light"
    border-variant="secondary"
    :title="track.src"
    class="my-2"
  >
    <router-link :to="'/track/'+track.id">
      <b-card-text>
        {{ track.monthAndDay() }}
        / {{ Math.round(track.distance() / 1000) }} km
        / {{ Math.round(track.ascent) }} m
        / {{ track.timeLengthFormatted() }} h
      </b-card-text>
    </router-link>
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
