// vuex.d.ts
import { Store } from 'vuex'

type SelectionObject = { selected: number[] , deselected: number[] }


declare module '@vue/runtime-core' {
  // declare your own store states
  interface State {
    selectionForList: SelectionObject
    loadedTracks: Track[] 
    tracksById: { [index: number]: Track }
    trackLoadStatus: number 
    resizeMap: boolean 
    redrawTracksOnMap: boolean
    selectionForList: SelectionObject | null
    selectionForMap: SelectionObject | null 
  }

  // provide typings for `this.$store`
  interface ComponentCustomProperties {
    $store: Store<State>
  }
}
