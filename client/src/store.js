import Vue from 'vue'
import Vuex from 'vuex'
const _ = require('lodash')

Vue.use(Vuex)

export default new Vuex.Store(
  {
    state: {
      loadedTracks: [],
      tracksById: {},
      trackLoadStatus: 'not_loaded',
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
        commit('setTrackLoadStatus', 'loading')
        const trackList = await loadFunction() // [ Track1, Track2, Track3 ] oder auch [ { id: 403, name: "Hammerau", .}, { id: x, ... }]
        commit('setLoadedTracks', trackList)
        commit('setTrackLoadStatus', 'loaded')
        commit('redrawTracksOnMapFlag', true)
      },
      async clearTracks ({ commit }) {
        commit('setTrackLoadStatus', 'loading')
        commit('setLoadedTracks', [])
        commit('setTrackLoadStatus', 'loaded')
        commit('redrawTracksOnMapFlag', true)
      },
      async modifyTrack ({ commit, state }, { id, props, updateFunction }) { // props is object with attributes and values
        // updates only properties from source to target track and updates backend
        commit('setTrackLoadStatus', 'updating')

        commit('modifyTrack', { id, props })
        await updateFunction(state.tracksById[id], _.keys(props))
        commit('setTrackLoadStatus', 'loaded')
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
