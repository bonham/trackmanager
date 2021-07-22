<template>
  <b-link
    :to="'/track/'+track.id"
    router-tag="div"
  >
    <b-card
      :title="track.src"
      class="my-2"
    >
      <b-card-text>
        {{ track.monthAndDay() }}
        / {{ (track.distance() / 1000).toFixed(2) }} km
        / {{ Math.round(track.ascent) }} m
        / {{ track.timeLengthFormatted() }} h
      </b-card-text>
    </b-card>
  </b-link>
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
