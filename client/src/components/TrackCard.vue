<template>
  <b-card class="my-2 clickable bg-light" :aria-label="ariaLinkLabel" role="link" @click="navigateToPage">
    <b-card-text>
      <b-row class="align-items-center">
        <b-col cols="9">
          <h4>
            {{ track.name || track.src }}
          </h4>
          <div class="text-decoration-none">
            <span>
              {{ track.monthAndDay() }}
              / {{ (track.distance() / 1000).toFixed(1) }} km
              / {{ track.getAscent() ? Math.round(track.getAscent()) : "-" }} m
            </span>
            <span v-if="track.getTimeLength()">
              / {{ track.timeLengthFormatted() }} h
            </span>
            <span v-if="track.speedKmh() !== null">
              / {{ Math.round(track.speedKmh() as number * 10) / 10 }} km/h
            </span>
          </div>
        </b-col>
        <b-col cols="3" class="d-flex align-items-center justify-content-end">
          <i-bi-chevron-right />
        </b-col>
      </b-row>
    </b-card-text>
  </b-card>
</template>

<script setup lang="ts">

import { Track } from '@/lib/Track'
import {
  BCard, BCardText,
  BRow, BCol
} from 'bootstrap-vue-next'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

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

const router = useRouter()
const navigateToPage = async () => {
  const target = `/track/${props.track.id}/sid/${props.sid}`
  await router.push(target)
}

</script>
<style scoped>
.card-icon {
  font-size: 4rem;
}

.clickable {
  cursor: pointer;
}

tyle scoped>.clickable {
  cursor: pointer;
}
</style>