<template>
  <div>
    <div>
      Load status: {{ trackLoadStatus }}
    </div>
    <div>
      <ul>
        <li
          v-for="track in loadedTracks"
          :key="track.id"
        >
          {{ track.name }}
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'

export default {
  name: 'FilteredTrackList',
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
