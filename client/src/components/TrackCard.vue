<template>
  <b-card
    class="my-2"
  >
    <b-card-text>
      <b-row class="align-items-center">
        <b-col cols="10">
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
          cols="2"
          class="d-flex align-items-center justify-content-end"
        >
          <div
            class="mx-2 mybox d-flex align-items-center justify-content-center"
          >
            X
          </div>
          <b-link
            :to="'/track/'+track.id"
          >
            <b-icon
              icon="chevron-right"
              class="mx-2 card-icon bg-light p-3"
              variant="secondary"
            />
          </b-link>
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
  font-size: 4rem;
}

.mybox {
  width: 4rem;
  min-width: 4rem;
  height: 4rem;
  background-color: azure;

}
</style>
