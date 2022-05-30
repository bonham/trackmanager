import Vue from 'vue'
import Vuex from 'vuex'
const _ = require('lodash')

Vue.use(Vuex)

export default new Vuex.Store(
  {
    state: {
      loadedTracks: [],
      tracksById: {},
      trackLoadStatus: 0, // 0:not loaded, 1:loading, 2:loaded
      resizeMap: false,
      redrawTracksOnMap: false,
      selectedTrack: null,
      scrollToTrack: null
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
      setSelectedTrack (state, trackId) {
        state.selectedTrack = trackId
      },
      setScrollToTrack (state, trackId) {
        state.scrollToTrack = trackId
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
        await dispatch('loadTracks', loadFunction)
        commit('redrawTracksOnMapFlag', true)
      },
      async clearTracks ({ commit }) {
        commit('setTrackLoadStatus', 1)
        commit('setLoadedTracks', [])
        commit('setTrackLoadStatus', 0)
        commit('redrawTracksOnMapFlag', true)
      },
      async selectTrackAndScroll ({ commit }, trackId) {
        commit('setSelectedTrack', trackId)
        commit('setScrollToTrack', trackId)
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
)
