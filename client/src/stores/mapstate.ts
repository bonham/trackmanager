import { defineStore } from 'pinia'
import { ref } from 'vue'

const useMapStateStore = defineStore('mapstate', () => {

  // command to load tracks
  const loadCommand = ref<LoadTracksRequest>({ command: 'none' })

  // If command processing is in progress or not
  const processComand = ref(false)

  return {
    loadCommand,
    processComand
  }

})

interface MapStateRequest {
  command: string,
  zoomOut?: boolean,
}

interface LoadAllRequest extends MapStateRequest {
  command: 'all',
}

interface LoadYearRequest extends MapStateRequest {
  command: 'year',
  payload: number,
}

interface LoadBboxRequest extends MapStateRequest {
  command: 'bbox',
  completed: boolean
}

interface LoadSingleTrackRequest extends MapStateRequest {
  command: 'track',
  payload: number
}


interface InitialState extends MapStateRequest {
  command: 'none'
}

export { useMapStateStore }
export type LoadTracksRequest = LoadAllRequest | LoadYearRequest | LoadBboxRequest | LoadSingleTrackRequest | InitialState

