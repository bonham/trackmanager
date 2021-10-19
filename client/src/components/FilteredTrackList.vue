<template>
  <div>
    <div>
      Load status: {{ trackLoadStatus }}
    </div>
    <div class="p-2">
      <b-list-group>
        <b-list-group-item
          v-for="track in loadedTracks"
          :key="track.id"
        >
          {{ track.name }}
        </b-list-group-item>
      </b-list-group>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
import { BListGroup, BListGroupItem } from 'bootstrap-vue'

export default {
  name: 'FilteredTrackList',
  components: {
    BListGroup,
    BListGroupItem
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
