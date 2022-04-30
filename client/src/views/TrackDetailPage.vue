<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <div class="flex-grow-1 d-flex flex-column">
      <h1>Track {{ $route.params.id }} Details</h1>
      <MapComponent
        :track-id="Number.parseInt($route.params.id)"
        :sid="sid"
      />
    </div>
  </b-container>
</template>

<script>
import MapComponent from '@/components/MapComponent.vue'
export default {
  name: 'MapC',
  components: {
    MapComponent
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  }

}
</script>
