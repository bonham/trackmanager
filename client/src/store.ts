import _ from 'lodash'
import type { GetterTree, MutationTree, ActionTree } from "vuex"
import type { Track, TrackPropertiesOptional } from '@/lib/Track'

type SelectionObject = { selected: number[], deselected: number[] }
const EMPTY_SELECTION_OBJ: SelectionObject = { selected: [], deselected: [] }

class State {
  loadedTracks: Track[] = []
  tracksById: { [index: number]: Track } = {}
  trackLoadStatus: number = 0 // 0:not loaded, 1:loading, 2:loaded
  resizeMap: boolean = false
  redrawTracksOnMap: boolean = false
  selectionForList: SelectionObject | null = EMPTY_SELECTION_OBJ
  // The following field is a 'command' field. Setting this field should trigger some actions in map
  // after action in map is completed, the 'command' field is cleared
  selectionForMap: SelectionObject | null = EMPTY_SELECTION_OBJ
}

const mutations = <MutationTree<State>>{
  setLoadedTracks(state, trackList: Track[]) {
    state.tracksById = {}
    state.loadedTracks = trackList
    trackList.forEach(function (el) {
      const id = el.id
      state.tracksById[id] = el
    })
  },
  modifyTrack(state, { id, props }: { id: number, props: TrackPropertiesOptional }) {
    const trackToModify = state.tracksById[id]
    _.assign(trackToModify, props)
  },
  // for track metadata only
  setTrackLoadStatus(state, status: number) {
    state.trackLoadStatus = status
  },
  // used as events to indicate that the map needs a resize
  resizeMapFlag(state) {
    state.resizeMap = true
  },
  resizeMapClear(state) {
    state.resizeMap = false
  },
  // used as event to indicate that the map needs redraw layers
  redrawTracksOnMapFlag(state, status: boolean) {
    state.redrawTracksOnMap = status
  },
  updateSelectionForList(state, selectChanges: SelectionObject) {
    state.selectionForList = selectChanges
  },
  updateSelectionForMap(state, selectChanges: SelectionObject) {
    state.selectionForMap = selectChanges
  },
  clearSelectionForList(state) {
    state.selectionForList = null
  },
  clearSelectionForMap(state) {
    state.selectionForMap = null
  }
};

export interface RootState { }
type TrackArray = Track[]
type LoadFunctionType = () => Promise<TrackArray>

const actions = <ActionTree<State, RootState>>{

  async loadTracks({ commit }, loadFunction: LoadFunctionType) {
    commit('setTrackLoadStatus', 1)
    const trackList = await loadFunction() // [ Track1, Track2, Track3 ] oder auch [ { id: 403, name: "Hammerau", .}, { id: x, ... }]
    commit('setLoadedTracks', trackList)
    commit('setTrackLoadStatus', 2)
  },
  async loadTracksAndRedraw({ commit, dispatch }, loadFunction: LoadFunctionType) {
    await commit('updateSelectionForList', EMPTY_SELECTION_OBJ)
    await commit('updateSelectionForMap', EMPTY_SELECTION_OBJ)
    await dispatch('loadTracks', loadFunction)
    commit('redrawTracksOnMapFlag', true)
  }

}

const getters = <GetterTree<State, RootState>>{
  getLoadedTrackIds: state => {
    return _.map(state.loadedTracks, (x) => { return x.id })
  },
  getTrackById: (state) => (id: number) => {
    return state.tracksById[id]
  }
};


export const store = {
  state: new State(),
  mutations,
  actions,
  getters
}
