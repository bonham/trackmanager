<template>
  <track-manager-nav-bar :sid="sid">
    <div class="flex-grow-1 d-flex flex-column">
      <h1 class="mt-4 mb-4">
        Track {{ id }} Details
      </h1>
      <MapComponent :track-id="Number.parseInt(id)" :sid="sid" />
    </div>
  </track-manager-nav-bar>
</template>

<script lang="ts" setup>
import MapComponent from '@/components/MapComponent.vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'

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
</script>
