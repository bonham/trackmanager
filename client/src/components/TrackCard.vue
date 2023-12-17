<template>
  <b-link :to="'/track/' + track.id + '/sid/' + sid" :aria-label="ariaLinkLabel">
    <b-card class="my-2">
      <b-card-text>
        <b-row class="align-items-center">
          <b-col cols="9">
            <h4>
              {{ track.name || track.src }}
            </h4>
            <div class="text-decoration-none">
              {{ track.monthAndDay() }}
              / {{ (track.distance() / 1000).toFixed(2) }} km
              / {{ track.ascent ? Math.round(track.ascent) : "-" }} m
              / {{ track.timeLengthFormatted() }} h
              / {{ track.timelength }} s
              / {{ track.timelength ? Math.round((3.6 * track.distance() / track.timelength) * 10) / 10 : "-" }} km/h
              avg.
            </div>
          </b-col>
          <b-col cols="3" class="d-flex align-items-center justify-content-end">
            <i-bi-chevron-right />
          </b-col>
        </b-row>
      </b-card-text>
    </b-card>
  </b-link>
</template>

<script lang="ts" setup>

import { Track } from '@/lib/Track'
import {
  BCard, BCardText,
  BRow, BCol, BLink
} from 'bootstrap-vue-next'
import { computed } from 'vue'

const props = defineProps({
  track: {
    type: Track,
    default: null
  },
  sid: {
    type: String,
    default: ''
  }

})

const ariaLinkLabel = computed(() => {
  return `link-to-track-${props.track.id}`
})

</script>
<style scoped>
.card-icon {
  font-size: 4rem;
}
</style>
