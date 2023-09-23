import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

import _ from 'lodash'
import { Track, type TrackPropertiesOptional } from '@/lib/Track'

type TrackArray = Track[]
type LoadFunctionType = () => Promise<TrackArray>

type SelectionObject = { selected: number[], deselected: number[] }
const EMPTY_SELECTION_OBJ: SelectionObject = { selected: [], deselected: [] }


export const useTracksStore = defineStore('tracks', () => {
  const loadedTracks: Ref<Track[]> = ref([])
  const tracksById: Ref<{ [index: number]: Track }> = ref({})
  const trackLoadStatus = ref(0) // 0:not loaded, 1:loading, 2:loaded
  const resizeMap = ref(false)
  const redrawTracksOnMap = ref(false)
  const selectionForList: Ref<SelectionObject | null> = ref(EMPTY_SELECTION_OBJ)
  // The following field is a 'command' field. Setting this field should trigger some actions in map
  // after action in map is completed, the 'command' field is cleared
  const selectionForMap: Ref<SelectionObject | null> = ref(EMPTY_SELECTION_OBJ)

  // getters
  const getLoadedTrackIds = computed(() => {
    return _.map(loadedTracks.value, (x) => { return x.id })
  },)

  const getTrackById = computed(() => (id: number) => {
    return tracksById.value[id]
  })

  // actions
  function setLoadedTracks(trackList: Track[]) {
    tracksById.value = {}
    loadedTracks.value = trackList
    trackList.forEach(function (el) {
      const id = el.id
      tracksById.value[id] = el
    })
  }

  function modifyTrack({ id, props }: { id: number, props: TrackPropertiesOptional }) {
    const trackToModify = tracksById.value[id]
    _.assign(trackToModify, props)
  }

  async function loadTracks(loadFunction: LoadFunctionType) {
    trackLoadStatus.value = 1
    const trackList = await loadFunction() // [ Track1, Track2, Track3 ] oder auch [ { id: 403, name: "Hammerau", .}, { id: x, ... }]
    await setLoadedTracks(trackList)
    trackLoadStatus.value = 2
  }

  async function loadTracksAndRedraw(loadFunction: LoadFunctionType) {
    selectionForList.value = EMPTY_SELECTION_OBJ
    selectionForMap.value = EMPTY_SELECTION_OBJ
    await loadTracks(loadFunction)
    redrawTracksOnMap.value = true
  }

  function updateSelectionForList(selectChanges: SelectionObject) {
    selectionForList.value = selectChanges
  }

  return {
    loadedTracks, tracksById, trackLoadStatus,
    resizeMap, redrawTracksOnMap, selectionForList,
    selectionForMap, getLoadedTrackIds, getTrackById,
    setLoadedTracks, modifyTrack, loadTracksAndRedraw,
    updateSelectionForList, loadTracks
  }

})


