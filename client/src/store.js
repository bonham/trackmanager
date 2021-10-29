import Vue from 'vue'
import Vuex from 'vuex'

const _ = require('lodash')

Vue.use(Vuex)

export default new Vuex.Store(
  {
    state: {
      loadedTracks: {},
      visibleTrackIds: [],
      trackLoadStatus: 'not_loaded',
      resizeMap: false
    },
    mutations: {
      setLoadedTracks (state, trackList) {
        const o = {}
        trackList.forEach(track => {
          const id = track.id
          o[id] = track
        })
        state.loadedTracks = o
      },
      setVisibleTracks (state, idList) {
        state.visibleTrackIds = idList
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
      }
    },
    actions: {
      async loadTracks ({ commit, state }, loadFunction) {
        if (state.trackLoadStatus === 'not_loaded') {
          commit('setTrackLoadStatus', 'loading')
          const trackList = await loadFunction()
          commit('setLoadedTracks', trackList)
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
