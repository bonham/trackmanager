<template>
  <div>
    <div class="p-2">
      <div class="bg-light fs-2 listheader border-top border-left border-right rounded">
        <span v-if="trackLoadStatus === 0">Not loaded</span>
        <span v-else-if="trackLoadStatus === 1">
          Loading
          <b-spinner
            small
            label="Spinning"
          />
        </span>
        <span v-else>Loaded</span>
      </div>
      <b-card
        ref="testref"
        no-body
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
            @click="setActive(track.id)"
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
import { mapState, mapMutations } from 'vuex'
import { BListGroup, BListGroupItem, BCard, BSpinner } from 'bootstrap-vue'

export default {
  name: 'FilteredTrackList',
  components: {
    BListGroup,
    BListGroupItem,
    BCard,
    BSpinner
  },
  computed: {
    ...mapState([
      'loadedTracks',
      'trackLoadStatus',
      'selectedTrack'
    ]),
    loadedTracksSorted () {
      const l = this.loadedTracks
      l.sort((a, b) => (a.secondsSinceEpoch() - b.secondsSinceEpoch()))
      return l
    }
  },
  created () {
    this.$watch(
      // watch for scroll trigger
      function (state) {
        return this.$store.state.scrollToTrack
      },
      (trackId) => {
        if (trackId) {
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
      return (this.selectedTrack === trackId)
    },
    setActive (trackId) {
      this.setSelectedTrack(trackId)
    },
    ...mapMutations([
      'setSelectedTrack'
    ])
  }
}
</script>
<style scoped>
.fs-2 {
  font-size: .8rem;
}

.listheader {
  padding: 0.75rem 1.25rem;
  margin-bottom: 0;
}
</style>
