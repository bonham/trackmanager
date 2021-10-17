<template>
  <div
    id="root"
    class="position-absolute h-100 w-100 border border-primary d-flex flex-column"
  >
    <track-manager-nav-bar />
    <div class="d-flex flex-row border border-warning flex-grow-1">
      <div
        id="one"
        class="flex-grow-1 border border-primary overflow-hidden"
      >
        left
      </div>
      <div
        id="two"
        class="flex-grow-1 border border-primary overflow-hidden"
      >
        right
      </div>
    </div>
  </div>
</template>

<script>
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar
  },
  data () {
    return {
      text: `
          Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry
        `
    }
  }
}
</script>
<style scoped>

</style>
