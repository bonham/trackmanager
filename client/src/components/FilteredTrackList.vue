<template>
  <div>
    <div class="p-2">
      <div class="bg-light fs-2 listheader border-top border-left border-right rounded">
        <span v-if="trackLoadStatus === 0">Not loaded</span>
        <span v-else-if="trackLoadStatus === 1">
          Loading
          <b-spinner small label="Spinning" />
        </span>
        <span v-else>{{ headline }}</span>
      </div>
      <b-card ref="testref" no-body>
        <b-list-group flush>
          <b-list-group-item v-for="track in loadedTracksSorted" :key="track.id" :ref="'track_' + track.id"
            :label="'track_' + track.id" :active="itemActiveStatus(track.id)" @click="toggleActive(track.id)">
            <span>{{ track.name }}, </span>
            <span>{{ (track.distance() / 1000).toFixed(0) }} km, {{ track.localeDateShort() }}</span>
          </b-list-group-item>
        </b-list-group>
      </b-card>
    </div>
  </div>
</template>
<script lang="ts">
import { mapState } from 'vuex'
import { BListGroup, BListGroupItem, BCard, BSpinner } from 'bootstrap-vue-next'
import { TrackCollection, Track } from '@/lib/Track'

export default {
  name: 'FilteredTrackList',
  compatConfig: {
    WATCH_ARRAY: false
  },
  components: {
    BListGroup,
    BListGroupItem,
    BCard,
    BSpinner
  },
  data() {
    return {
      selectedTrackMap: [] as { [index: number]: boolean },
      selectedTrackList: [] as number[]
    }
  },
  computed: {
    ...mapState([
      'loadedTracks',
      'trackLoadStatus'
    ]),
    loadedTracksSorted() {
      const l = this.loadedTracks
      l.sort((a: Track, b: Track) => (a.secondsSinceEpoch() - b.secondsSinceEpoch()))
      return l
    },
    sumDistance() {
      const tc = new TrackCollection(this.loadedTracks)
      return tc.distance()
    },
    headline() {
      const dist = Math.round(this.sumDistance / 1000)
      return `${this.loadedTracks.length} Tracks, ${dist} km`
    }
  },
  created() {
    // (Re- Initialize) map for selected tracks when loaded tracks are changing
    this.$watch(
      () => {
        return this.loadedTracks
      },
      (tracks) => {
        const allDeselected = {} as any
        tracks.forEach((track: Track) => {
          allDeselected[track.id] = false
        })
        this.selectedTrackMap = allDeselected
      }
    )
    this.$watch(
      () => {
        return this.$store.state.selectionForList
      },
      async (selectionUpdateObj) => {
        if (selectionUpdateObj !== null) {
          await this.updateSelectedTracksData(
            selectionUpdateObj.selected,
            selectionUpdateObj.deselected
          )
          if (selectionUpdateObj.selected.length > 0) {
            const scrollId = selectionUpdateObj.selected[0]

            const itemRef = `track_${scrollId}`
            const listgroupItem = this.$refs[itemRef] as InstanceType<typeof BListGroupItem>[]
            const htmlElement = listgroupItem[0].$el as Element
            htmlElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            })
          }
        }
      }
    )
  },
  methods: {
    itemActiveStatus(trackId: number) {
      return this.selectedTrackMap[trackId]
    },
    toggleActive(newTrackId: number) {
      // currently - shift select abd deselect is not implemented
      const deselected = this.selectedTrackList
      const selected = [newTrackId]

      this.updateSelectedTracksData(selected, deselected)
    },
    updateSelectedTracksData(toSelectList: number[], toDeselectList: number[]) {
      toDeselectList.forEach(tid => {
        this.selectedTrackMap[tid] = false
      })
      toSelectList.forEach(tid => {
        this.selectedTrackMap[tid] = true
      })
      this.selectedTrackList = toSelectList
    },
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
