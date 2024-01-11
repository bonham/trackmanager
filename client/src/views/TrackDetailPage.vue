<template>
  <track-manager-nav-bar :sid="sid">
    <div class="flex-grow-1 d-flex flex-column">
      <b-card class="m-2 bg-light">
        <h5>
          {{ headline }}
        </h5>
        <div>
          {{ trackDetails }}
        </div>
      </b-card>

      <MapComponent :sid="sid" />
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import {
  BCard,
} from 'bootstrap-vue-next'
import MapComponent from '@/components/MapComponent.vue';
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { useTrackStore } from '@/stores/trackStore';
import { useMapStateStore } from '@/stores/mapstate'
import { nextTick, ref } from 'vue';
import { getTrackById } from '@/lib/trackServices';

const mapStateStore = useMapStateStore()
const trackStore = useTrackStore()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  sid: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: 'iddefault'
  }
})

const headline = ref("")
const trackDetails = ref("")

// load track metadata
getTrackById(Number.parseInt(props.id), props.sid)
  .then((track) => {

    if (track !== null) {

      // headline
      headline.value = track.name ? track.name : ""

      // details
      const part1: string = `${track.localeDateShort()} / `;
      const part2: string = `${(track.distance() / 1000).toFixed(1)} km / `;
      const part3: string = `${track.ascent ? Math.round(track.ascent) : "-"} m`;
      const part4: string = track.timelength ? ` / ${track.timeLengthFormatted()} h / ${track.timelength ? Math.round((3.6 * track.distance() / track.timelength) * 10) / 10 : "-"} km/h` : "";
      trackDetails.value = part1 + part2 + part3 + part4

      // fill the cache
      trackStore.setLoadedTracks([track])

      // set title
      // const descEl = document.querySelector('head meta[name="description"]');
      const titleEl = document.querySelector('head title');
      if (titleEl !== null) {
        titleEl.textContent = headline.value
      }

    } else {
      trackDetails.value = "unknown"
    }
  })
  .catch((e) => {
    console.error(`Error while loading track ${props.id}`, e)
  })

nextTick(() => {
  // send command to MapComponent to load a single track
  mapStateStore.loadCommand = {
    command: 'track',
    payload: Number.parseInt(props.id),
    zoomOut: true
  }

}).catch((e) => { console.error(e) })
</script>
