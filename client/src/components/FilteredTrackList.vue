<template>
  <div>
    <div class="p-2">
      <b-card
        no-body
        :header="'List of Tracks - '+trackLoadStatus"
        class="fs-2"
      >
        <b-list-group
          flush
        >
          <b-list-group-item
            v-for="track in loadedTracks"
            :key="track.id"
          >
            <span class="text-body">{{ track.name }}, </span>
            <span class="text-secondary">{{ (track.distance() / 1000).toFixed(0) }} km, {{ track.localeDateShort() }}</span>
          </b-list-group-item>
        </b-list-group>
      </b-card>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
import { BListGroup, BListGroupItem, BCard } from 'bootstrap-vue'

export default {
  name: 'FilteredTrackList',
  components: {
    BListGroup,
    BListGroupItem,
    BCard
  },
  data () {
    return {
      testprop: 'nix'
    }
  },
  computed: {
    ...mapState([
      'loadedTracks',
      'trackLoadStatus'
    ])
  }
}
</script>
<style scoped>
.fs-2 {
  font-size: .8rem;
}
</style>
