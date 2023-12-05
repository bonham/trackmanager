import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMapStateStore = defineStore('mapstate', () => {

  // command to load tracks
  const loadCommand = ref<LoadTracksRequest>({ command: 'none' })

  // If command processing is in progress or not
  const processComand = ref(false)

  return {
    loadCommand,
    processComand
  }

})

interface LoadYearRequest {
  command: 'year',
  payload: number,
  zoomOut?: boolean
}

interface LoadBboxRequest {
  command: 'bbox',
  completed: boolean
  zoomOut?: boolean
}

interface InitialState {
  command: 'none'
}

export type LoadTracksRequest = LoadYearRequest | LoadBboxRequest | InitialState

