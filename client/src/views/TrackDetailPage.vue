<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar :sid="sid" />
    <div class="flex-grow-1 d-flex flex-column">
      <h1 class="mt-4 mb-4">
        Track {{ $route.params.id }} Details
      </h1>
      <MapComponent
        :track-id="Number.parseInt($route.params.id)"
        :sid="sid"
      />
    </div>
  </b-container>
</template>

<script>
import MapComponent from '@/components/MapComponent.vue'
import { BContainer } from 'bootstrap-vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'

export default {
  name: 'MapC',
  components: {
    MapComponent,
    BContainer,
    TrackManagerNavBar
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  }

}
</script>
