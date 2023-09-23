<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div>
    <div class="p-2">
      <div class="bg-light fs-2 listheader border-top border-left border-right rounded">
        <span v-if="store.trackLoadStatus === 0">Not loaded</span>
        <span v-else-if="store.trackLoadStatus === 1">
          Loading
          <b-spinner small label="Spinning" />
        </span>
        <span v-else>{{ headline }}</span>
      </div>
      <b-card no-body>
        <b-list-group flush>
          <b-list-group-item v-for="track in loadedTracksSorted" :key="track.id" :label="'track_' + track.id"
            :active="itemActiveStatus(track.id)" @click="toggleActive(track.id)">
            <span>{{ track.name }}, </span>
            <span>{{ (track.distance() / 1000).toFixed(0) }} km, {{ track.localeDateShort() }}</span>
          </b-list-group-item>
        </b-list-group>
      </b-card>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { BListGroup, BListGroupItem, BCard, BSpinner } from 'bootstrap-vue-next'
import { TrackCollection, Track } from '@/lib/Track'
import { useTracksStore } from '@/storepinia'
import { ref, watch, computed } from 'vue'
import type { Ref } from 'vue'


const selectedTrackMap: Ref<({ [index: number]: boolean })> = ref([])
const selectedTrackList: Ref<(number[])> = ref([])

const store = useTracksStore()


const loadedTracksSorted = computed(() => {
  const l = store.loadedTracks
  l.sort((a: Track, b: Track) => (a.secondsSinceEpoch() - b.secondsSinceEpoch()))
  return l
})
const sumDistance = computed(() => {
  const tc = new TrackCollection(store.loadedTracks)
  return tc.distance()
})

const headline = computed(() => {
  const dist = Math.round(sumDistance.value / 1000)
  return `${store.loadedTracks.length} Tracks, ${dist} km`
})

// init
// (Re- Initialize) map for selected tracks when loaded tracks are changing
watch(
  () => {
    return store.loadedTracks
  },
  (tracks) => {
    const allDeselected = {} as any
    tracks.forEach((track: Track) => {
      allDeselected[track.id] = false
    })
    selectedTrackMap.value = allDeselected
  }
)

function itemActiveStatus(trackId: number) {
  return selectedTrackMap.value[trackId]
}
function toggleActive(newTrackId: number) {
  // currently - shift select abd deselect is not implemented
  const deselected = selectedTrackList.value
  const selected = [newTrackId]

  updateSelectedTracksData(selected, deselected)
}
function updateSelectedTracksData(toSelectList: number[], toDeselectList: number[]) {
  toDeselectList.forEach(tid => {
    selectedTrackMap.value[tid] = false
  })
  toSelectList.forEach(tid => {
    selectedTrackMap.value[tid] = true
  })
  selectedTrackList.value = toSelectList
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
