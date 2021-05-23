<template>
  <div>
    <h1>Track {{ $route.params.id }} Details</h1>
    <MapComponent />
  </div>
</template>

<script>
import MapComponent from '@/components/MapComponent.vue'
export default {
  name: 'MapC',
  components: {
    MapComponent
  }
}
</script>
