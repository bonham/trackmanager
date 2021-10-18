<template>
  <div
    id="root"
    class="position-absolute h-100 w-100 d-flex flex-column"
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
        class="overflow-hidden"
        :style="leftBoxStyleObject"
      >
        left
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
        right
      </div>
    </div>
  </div>
</template>

<script>
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'

const MIDDLE_BAR_WIDTH = '10'

export default {
  name: 'SelectTracksPage',
  components: {
    TrackManagerNavBar
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
  mounted: function () {
    this.leftBoxStyleObject['flex-basis'] = this.initialLeftBoxSize() + 'px'
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
    }
  }
}
</script>
<style scoped>
</style>
