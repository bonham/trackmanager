import Vue from 'vue'
import Vuex from 'vuex'

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
      setLoadedTracks (state, trackList) {
        state.loadedTracks = trackList
      },
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
      }
    }
  }
)
