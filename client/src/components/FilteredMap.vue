<template>
  <div class="position-absolute">
    <map-component :track-id="2" />
  </div>
</template>
<script>
import MapComponent from '@/components/MapComponent.vue'
export default {
  name: 'FilteredMap',
  components: { MapComponent },
  data () {
    return {
      testprop: 'nix2'
    }
  }
}
</script>
