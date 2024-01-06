<template>
  <track-manager-nav-bar :sid="sid">
    <div class="flex-grow-1 d-flex flex-column">
      <h1 class="mt-4 mb-4">
        Track {{ id }} Details
      </h1>
      <MapComponent :sid="sid" />
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import MapComponent from '@/components/MapComponent.vue';
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { useMapStateStore } from '@/stores/mapstate'
import { nextTick } from 'vue';

const mapStateStore = useMapStateStore()

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

nextTick(() => {
  // send command to MapComponent to load a single track
  mapStateStore.loadCommand = {
    command: 'track',
    payload: Number.parseInt(props.id),
    zoomOut: true
  }

}).catch((e) => { console.error(e) })
</script>
