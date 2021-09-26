import Vue from 'vue'
import Vuex from 'vuex'
const _ = require('lodash')

Vue.use(Vuex)

export default new Vuex.Store(
  {
    state: {
      loadedTracks: {},
      visibleTrackIds: []
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
      }
    },
    getters: {
      visibleTracks: state => {
        return _.pick(state.loadedTracks, state.visibleTrackIds)
      }
    }
  }
)
