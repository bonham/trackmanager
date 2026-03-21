import { defineStore } from 'pinia'
import { ref, type Ref } from 'vue'
import { Track } from '@/lib/Track'

type YearState = Record<number, boolean>

const useTrackOverviewStore = defineStore('trackOverview', () => {

  const loadedTracks: Ref<Track[]> = ref([])
  const collectionExpandState = ref<YearState>({})
  const expandPressed = ref(false)
  const scrollPosition = ref(0)
  const selectedTrackId = ref<number | null>(null)

  function setLoadedTracks(tracks: Track[]) {
    loadedTracks.value = tracks
  }

  function setCollectionExpandState(state: YearState) {
    collectionExpandState.value = state
  }

  function setExpandPressed(value: boolean) {
    expandPressed.value = value
  }

  function setScrollPosition(position: number) {
    scrollPosition.value = position
  }

  function setSelectedTrackId(id: number | null) {
    selectedTrackId.value = id
  }

  function resetState() {
    loadedTracks.value = []
    collectionExpandState.value = {}
    expandPressed.value = false
    scrollPosition.value = 0
    selectedTrackId.value = null
  }

  return {
    loadedTracks,
    collectionExpandState,
    expandPressed,
    scrollPosition,
    selectedTrackId,
    setLoadedTracks,
    setCollectionExpandState,
    setExpandPressed,
    setScrollPosition,
    setSelectedTrackId,
    resetState
  }

})

export { useTrackOverviewStore }
