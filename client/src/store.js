import _ from 'lodash'

const EMPTY_SELECTION_OBJ = { selected: [], deselected: [] }

export const store = {
  state: {
    loadedTracks: [],
    tracksById: {},
    trackLoadStatus: 0, // 0:not loaded, 1:loading, 2:loaded
    resizeMap: false,
    redrawTracksOnMap: false,
    selectionForList: EMPTY_SELECTION_OBJ,
    selectionForMap: EMPTY_SELECTION_OBJ
  },
  mutations: {
    // for track metadata only
    // clears previous values
    setLoadedTracks (state, trackList) {
      state.tracksById = {}
      state.loadedTracks = trackList
      trackList.forEach(function (el) {
        const id = el.id
        state.tracksById[id] = el
      })
    },
    modifyTrack (state, { id, props }) {
      const trackToModify = state.tracksById[id]
      _.assign(trackToModify, props)
    },
    // for track metadata only
    setTrackLoadStatus (state, status) {
      state.trackLoadStatus = status
    },
    // used as events to indicate that the map needs a resize
    resizeMapFlag (state) {
      state.resizeMap = true
    },
    resizeMapClear (state) {
      state.resizeMap = false
    },
    // used as event to indicate that the map needs redraw layers
    redrawTracksOnMapFlag (state, status) {
      state.redrawTracksOnMap = status
    },
    updateSelectionForList (state, selectChanges) {
      state.selectionForList = selectChanges
    },
    updateSelectionForMap (state, selectChanges) {
      state.selectionForMap = selectChanges
    },
    clearSelectionForList (state) {
      state.selectionForList = null
    },
    clearSelectionForMap (state) {
      state.selectionForMap = null
    }
  },
  actions: {
    async loadTracks ({ commit }, loadFunction) {
      commit('setTrackLoadStatus', 1)
      const trackList = await loadFunction() // [ Track1, Track2, Track3 ] oder auch [ { id: 403, name: "Hammerau", .}, { id: x, ... }]
      commit('setLoadedTracks', trackList)
      commit('setTrackLoadStatus', 2)
    },
    async loadTracksAndRedraw ({ commit, dispatch }, loadFunction) {
      await commit('updateSelectionForList', EMPTY_SELECTION_OBJ)
      await commit('updateSelectionForMap', EMPTY_SELECTION_OBJ)
      await dispatch('loadTracks', loadFunction)
      commit('redrawTracksOnMapFlag', true)
    }

  },
  getters: {
    getLoadedTrackIds: state => {
      return _.map(state.loadedTracks, (x) => { return x.id })
    },
    getTrackById: (state) => (id) => {
      return state.tracksById[id]
    }

  }
}
