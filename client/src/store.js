import Vue from 'vue'
import Vuex from 'vuex'
const _ = require('lodash')

Vue.use(Vuex)

export default new Vuex.Store(
  {
    state: {
      loadedTracks: [],
      trackLoadStatus: 'not_loaded',
      resizeMap: false,
      redrawTracksOnMap: false
    },
    mutations: {
      // for track metadata only
      setLoadedTracks (state, trackList) {
        state.loadedTracks = trackList
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
      }
    },
    actions: {
      async loadTracks ({ commit, state }, loadFunction) {
        commit('setTrackLoadStatus', 'loading')
        const trackList = await loadFunction()
        commit('setLoadedTracks', trackList)
        commit('setTrackLoadStatus', 'loaded')
        commit('redrawTracksOnMapFlag', true)
      },
      async clearTracks ({ commit, state }, loadFunction) {
        commit('setTrackLoadStatus', 'loading')
        commit('setLoadedTracks', [])
        commit('setTrackLoadStatus', 'loaded')
        commit('redrawTracksOnMapFlag', true)
      }

    },
    getters: {
      getLoadedTrackIds: state => {
        return _.map(state.loadedTracks, (x) => { return x.id })
      }

    }
  }
)
