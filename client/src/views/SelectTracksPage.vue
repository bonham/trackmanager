<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100 border border-primary"
  >
    <track-manager-nav-bar />
    <div class="split flex-grow-1 d-flex flex-row minheight-0 border border-warning">
      <div
        id="leftpanel"
        class="overflow-auto minheight-0"
      >
        <filtered-track-list />
      </div>

      <div
        id="rightpanel"
        class="border border-info d-flex"
      >
        <filtered-map />
      </div>
    </div>
  </b-container>
</template>

<script>
import { BContainer } from 'bootstrap-vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '../components/FilteredTrackList.vue'
import FilteredMap from '../components/FilteredMap.vue'
import { getAllTracks } from '@/lib/trackServices.js'
import { mapActions, mapState } from 'vuex'
import Split from 'split.js'

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar,
    FilteredTrackList,
    FilteredMap,
    BContainer
  },
  data () {
    return {
      text: `
          Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry
        `
    }
  },
  computed: {
    ...mapState([
      'loadedTracks'
    ])
  },
  created: async function () {
    await this.loadTracks(getAllTracks)
  },
  mounted: function () {
    Split(['#leftpanel', '#rightpanel'])
  },
  methods: {
    ...mapActions([
      'loadTracks'
    ])

  }
}
</script>
<style scoped>
.minheight-0 {
  min-height: 0;
}

.gutter {
    background-color: #eee;
    background-repeat: no-repeat;
    background-position: 50%;
}

.gutter.gutter-horizontal {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
    cursor: col-resize;
}
</style>
