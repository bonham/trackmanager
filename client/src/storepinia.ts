import { defineStore } from 'pinia'
import { ref, markRaw, computed } from 'vue'
import type { Ref } from 'vue'

import _ from 'lodash'
import { Track, type TrackPropertiesOptional } from '@/lib/Track'

type TrackArray = Track[]
type LoadFunctionType = () => Promise<TrackArray>

export const useTracksStore = defineStore('tracks', () => {
  const loadedTracks: Ref<Track[]> = ref(markRaw([]))
  const tracksById: Ref<{ [index: number]: Track }> = ref({})
  const resizeMap = ref(false)
  const redrawTracksOnMap = ref(false)

  /**
   * Returns track ids for which track details are loaded in store
   * 
   * @returns Array of numbers
   */
  const getLoadedTrackIds = computed(() => {
    return _.map(loadedTracks.value, (x) => { return x.id })
  },)

  const getTrackById = computed(() => (id: number) => {
    return tracksById.value[id]
  })

  // actions
  function setLoadedTracks(trackList: Track[]) {
    tracksById.value = {}
    loadedTracks.value = markRaw(trackList)
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
    const trackList = await loadFunction() // [ Track1, Track2, Track3 ] oder auch [ { id: 403, name: "Hammerau", .}, { id: x, ... }]
    setLoadedTracks(trackList)
  }

  return {
    loadedTracks, tracksById,
    resizeMap, redrawTracksOnMap,
    getLoadedTrackIds, getTrackById,
    setLoadedTracks, modifyTrack,
    loadTracks
  }

})


