<template>
  <div>
    <!-- <TrackHeader /> -->
    <b-row>
      <b-col>
        <div class="px-3 py-3 pt-md-5 pb-md-4 mx-auto">
          <b-card
            bg-variant="light"
            :title="label"
            class="my-2"
            @click="toggleMemberVisibility"
          >
            <b-card-text>
              <b-button>
                <b-icon :icon="expandIcon" />
              </b-button>
              <span class="mx-2">
                {{ Math.round(coll.distance() / 1000) }} km total
              </span>
            </b-card-text>
          </b-card>
          <transition
            name="section"
          >
            <div
              v-if="expanded"
              :style="styleObject"
            >
              <TrackCard
                v-for="item in myDataList"
                :key="item.id"
                :track="item"
              />
            </div>
          </transition>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
// import TrackHeader from '@/components/TrackHeader.vue'
import TrackCard from '@/components/TrackCard.vue'
import { TrackCollection } from '@/lib/Track.js'
import { debounce } from 'debounce'

export default {
  name: 'TrackSection',
  components: {
    // TrackHeader,
    TrackCard
  },
  props: {
    label: {
      type: String,
      default: 'No Section Label'
    },
    coll: {
      type: TrackCollection,
      default: null
    }
  },
  data () {
    return {
      myDataList: this.coll.members(),
      myLabel: this.label,
      expanded: true,
      maxHeight: window.innerHeight,
      myEh: null
    }
  },
  computed: {
    expandIcon: function () {
      return (this.expanded ? 'ArrowDownCircleFill' : 'ArrowRightCircleFill')
    },
    styleObject () {
      // maxheight style must be dynamically adjusted and needs to be
      // taller than content of div. Therefore his needs to come from
      // data field which is dynamically updated on window resize
      // ---maxh is a css variable. See transition style below where it is used.
      return {
        '--maxh': this.maxHeight + 'px',
        overflow: 'hidden'
      }
    }
  },
  created: function () {
    // resize event handler need to be stored in data object so that
    // there is a different handler for each instance of this component.
    // Debouncing needs to happen per component instance
    this.myEh = this.resizeEventHandler
    window.addEventListener('resize', debounce(this.myEh, 200))
  },
  destroyed: function () {
    window.removeEventListener('resize', this.myEh)
  },
  methods: {
    toggleMemberVisibility: function () {
      this.expanded = !(this.expanded)
    },
    // this eventhandler is the 'class' method and should not be registered directly
    // see comment from Vitim.us in https://stackoverflow.com/a/49381030/4720160
    resizeEventHandler: function () {
      this.maxHeight = window.innerHeight
      console.log('Resixze: ' + this.label + ', ' + this.innerHeight)
    }
  }
}
</script>

<style scoped>

.section-enter-active,
.section-leave-active {
  transition: all 0.2s linear 0s;
  max-height: var(--maxh);
}

.section-enter,
.section-leave-to {
  max-height: 0px;
}

</style>
