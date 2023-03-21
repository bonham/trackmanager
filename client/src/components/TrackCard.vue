<template>
  <b-card class="my-2">
    <b-card-text>
      <b-row class="align-items-center">
        <b-col cols="9">
          <h4>
            {{ track.name || track.src }}
          </h4>
          <div>
            {{ track.monthAndDay() }}
            / {{ (track.distance() / 1000).toFixed(2) }} km
            / {{ Math.round(track.ascent) }} m
            / {{ track.timeLengthFormatted() }} h
          </div>
        </b-col>
        <b-col cols="3" class="d-flex align-items-center justify-content-end">
          <b-link :to="'/track/' + track.id + '/sid/' + sid" :aria-label="ariaLinkLabel">
            <i-bi-chevron-right />
          </b-link>
        </b-col>
      </b-row>
    </b-card-text>
  </b-card>
</template>

<script lang="ts">

import { Track } from '@/lib/Track'
import {
  BCard, BCardText,
  BRow, BCol, BLink
} from 'bootstrap-vue-next'

export default {
  name: 'TrackCard',
  components: {
    BCard,
    BCardText,
    BRow,
    BCol,
    BLink
  },
  props: {
    track: {
      type: Track,
      default: null
    },
    sid: {
      type: String,
      default: ''
    }

  },
  computed: {
    ariaLinkLabel() {
      return `link-to-track-${this.track.id}`
    }
  }
}
</script>
<style scoped>
.card-icon {
  font-size: 4rem;
}
</style>
