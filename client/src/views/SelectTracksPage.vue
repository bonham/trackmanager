<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar />
    <div>
      <b-button
        class="m-2"
        @click="loadComplete(2021)"
      >
        2021
      </b-button>
      <b-button
        class="m-2"
        @click="loadComplete(2020)"
      >
        2020
      </b-button>
      <b-button
        class="m-2"
        @click="loadAllTracks()"
      >
        All
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
import { getTracksByYear, getAllTracks } from '@/lib/trackServices.js'
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

    loadComplete: function (year) {
    // call loadTracks action from store while injecting the load function
      const loadFunction = function () { return getTracksByYear(year) }
      this.loadTracks(loadFunction).catch(e => console.error(e))
    },
    loadAllTracks: function () {
      this.loadTracks(getAllTracks).catch(e => console.error(e))
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
