<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar />
    <div>
      <b-button @click="load2021Complete">
        2021
      </b-button>
    </div>
    <div class="split flex-grow-1 d-flex flex-row minheight-0">
      <div
        id="leftpanel"
        class="overflow-auto minheight-0"
      >
        <filtered-track-list />
      </div>

      <div
        id="rightpanel"
        class="d-flex"
      >
        <filtered-map />
      </div>
    </div>
  </b-container>
</template>

<script>
import { BContainer, BButton } from 'bootstrap-vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '../components/FilteredTrackList.vue'
import FilteredMap from '../components/FilteredMap.vue'
import { getTracksByYear } from '@/lib/trackServices.js'
import { mapActions, mapState, mapMutations } from 'vuex'
import Split from 'split.js'

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar,
    FilteredTrackList,
    FilteredMap,
    BContainer,
    BButton
  },
  computed: {
    ...mapState([
      'loadedTracks'
    ])
  },
  mounted: function () {
    // split should definitely run before the map is attached to the div
    // so when map is run through nextTick - then let's not run split in nexttick - otherwise
    // it runs to early and map is not correctly rendered
    Split(['#leftpanel', '#rightpanel'], {
      onDragEnd: this.resizeMapFlag
    })
  },
  methods: {
    ...mapActions([
      'loadTracks'
    ]),
    ...mapMutations([
      // indicate the map that it needs a resize
      'resizeMapFlag'
    ]),

    load2021Complete: function () {
    // call loadTracks action from store while injecting the load function
      const loadFunction = function () { return getTracksByYear(2020) }
      this.loadTracks(loadFunction).catch(e => console.log(e))
    }

  }
}
</script>
<style scoped>

/* Needed for vertical overflow: scroll in flexbox container */
.minheight-0 {
  min-height: 0;
}
</style>
<style>

/* Split.js css entries can not reside in scoped style section */
.gutter {
    background-color: rgb(255, 255, 255);
    background-repeat: no-repeat;
    background-position: 50%;
}

.gutter.gutter-horizontal {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
    cursor: col-resize;
}

</style>
