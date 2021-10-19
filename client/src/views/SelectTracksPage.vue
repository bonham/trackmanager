<template>
  <div>
    <b-container
      id="root"
      class="d-flex flex-column"
    >
      <track-manager-nav-bar />
      <div
        id="enclosing"
        ref="enclosing"
        class="d-flex flex-row flex-grow-1"
      >
        <div
          id="left"
          ref="left"
          :style="leftBoxStyleObject"
        >
          <filtered-track-list />
        </div>
        <div
          id="middle"
          ref="middle"
          class="overflow-hidden"
          :style="middleBoxStyleObject"
          @mousedown="dragMouseDown"
        />
        <div
          id="right"
          class="flex-grow-1 overflow-hidden"
        >
          <filtered-map />
        </div>
      </div>
    </b-container>
  </div>
</template>

<script>
import { BContainer } from 'bootstrap-vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '../components/FilteredTrackList.vue'
import FilteredMap from '../components/FilteredMap.vue'
import { getAllTracks } from '@/lib/trackServices.js'
import { mapActions, mapState } from 'vuex'

const MIDDLE_BAR_WIDTH = '10'

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
        `,
      positions: {
        clientX: undefined,
        clientY: undefined,
        movementX: 0,
        movementY: 0
      },
      leftBoxStyleObject: {
        'flex-basis': '49%' // inaccurate but will be set after 'mounted'
      },
      middleBoxStyleObject: {
        'flex-basis': MIDDLE_BAR_WIDTH + 'px',
        'background-color': 'lightgrey'
      }
    }
  },
  computed: {
    ...mapState([
      'loadedTracks'
    ])
  },
  mounted: function () {
    this.leftBoxStyleObject['flex-basis'] = this.initialLeftBoxSize() + 'px'
  },
  created: async function () {
    await this.loadTracks(getAllTracks)
  },
  methods: {
    dragMouseDown: function (event) {
      event.preventDefault()
      this.positions.clientX = event.clientX
      document.onmousemove = this.borderDrag
      document.onmouseup = this.closeDragElement
    },
    borderDrag: function (event) {
      event.preventDefault()
      this.positions.movementX = this.positions.clientX - event.clientX
      this.positions.clientX = event.clientX
      this.leftBoxStyleObject['flex-basis'] = (this.$refs.left.offsetWidth - this.positions.movementX) + 'px'
    },
    closeDragElement: function () {
      document.onmouseup = null
      document.onmousemove = null
    },
    initialLeftBoxSize: function () {
      const parWidth = this.$refs.enclosing.offsetWidth
      const leftBoxWidth = (parWidth - MIDDLE_BAR_WIDTH) / 2
      return leftBoxWidth
    },
    ...mapActions([
      'loadTracks'
    ])

  }
}
</script>
<style scoped>
</style>
