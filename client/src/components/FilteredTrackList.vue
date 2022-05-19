<template>
  <div>
    <div class="p-2">
      <b-card
        ref="testref"
        no-body
        :header="'List of Tracks - '+trackLoadStatus"
        class="fs-2"
      >
        <b-list-group
          flush
        >
          <b-list-group-item
            v-for="track in loadedTracksSorted"
            :key="track.id"
            :ref="'track_'+track.id"
            :active="itemActiveStatus(track.id)"
          >
            <span>{{ track.name }}, </span>
            <span>{{ (track.distance() / 1000).toFixed(0) }} km, {{ track.localeDateShort() }}</span>
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
  data: function () {
    return {
      activeItems: []
    }
  },
  computed: {
    ...mapState([
      'loadedTracks',
      'trackLoadStatus'
    ]),
    loadedTracksSorted () {
      const l = this.loadedTracks
      l.sort((a, b) => (a.secondsSinceEpoch() - b.secondsSinceEpoch()))
      return l
    }
  },
  created () {
    this.$watch(
      (state) => {
        return this.$store.state.selectedTrack
      },
      (trackId) => {
        if (trackId) {
          this.activeItems = [trackId]
          const itemRef = `track_${trackId}`
          this.$refs[itemRef][0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }
    )
  },
  methods: {
    itemActiveStatus (trackId) {
      return (this.activeItems.includes(trackId))
    }
  }
}
</script>
<style scoped>
.fs-2 {
  font-size: .8rem;
}
</style>
