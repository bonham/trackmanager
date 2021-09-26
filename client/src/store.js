import Vue from 'vue'
import Vuex from 'vuex'
const _ = require('lodash')

Vue.use(Vuex)

export default new Vuex.Store(
  {
    state: {
      loadedTracks: {},
      visibleTrackIds: [],
      trackLoadStatus: 'not_loaded'
    },
    mutations: {
      addToLoadedTracks (state, trackList) {
        trackList.forEach(track => {
          const id = track.id
          state.loadedTracks[id] = track
        })
      },
      setVisibleTracks (state, idList) {
        state.visibleTrackIds = idList
      },
      setTrackLoadStatus (state, status) {
        state.trackLoadStatus = status
      }
    },
    actions: {
      async loadTracks ({ commit, state }, loadFunction) {
        if (state.trackLoadStatus === 'not_loaded') {
          commit('setTrackLoadStatus', 'loading')
          const trackList = await loadFunction()
          commit('addToLoadedTracks', trackList)
          commit('setTrackLoadStatus', 'loaded')
        }
      }
    },
    getters: {
      visibleTracks: state => {
        return _.pick(state.loadedTracks, state.visibleTrackIds)
      }
    }
  }
)
