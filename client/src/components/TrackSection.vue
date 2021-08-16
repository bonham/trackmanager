<template>
  <div>
    <b-card
      bg-variant="light"
      class="my-2"
      @click="toggleMemberVisibility"
    >
      <b-card-text>
        <b-row class="align-items-center">
          <b-col
            cols="9"
            class="d-flex flex-row align-items-center border"
          >
            <b-button
              :class="expanded ? null : 'collapsed'"
              :aria-expanded="expanded ? 'true' : 'false'"
              :aria-controls="collapseId"
            >
              <b-icon
                :icon="expandIcon"
              />
            </b-button>
            <h4 class="mx-2 my-0">
              {{ label }}
            </h4>
            <div class="mx-2">
              {{ Math.round(coll.distance() / 1000) }} km total
            </div>
          </b-col>
          <b-col
            cols="3"
            class="border"
          >
            x
          </b-col>
        </b-row>
      </b-card-text>
    </b-card>
    <b-collapse
      :id="collapseId"
      v-model="expanded"
    >
      <TrackCard
        v-for="item in myDataList"
        :key="item.id"
        :track="item"
      />
    </b-collapse>
  </div>
</template>

<script>
// import TrackHeader from '@/components/TrackHeader.vue'
import TrackCard from '@/components/TrackCard.vue'
import { TrackCollection } from '@/lib/Track.js'
import { BCard, BCardText, BIcon, BIconArrowDownCircleFill, BIconArrowRightCircleFill } from 'bootstrap-vue'

export default {
  name: 'TrackSection',
  components: {
    TrackCard,
    // TrackCard: () => import(/* webpackChunkName: "TrackCard" */ '@/components/TrackCard.vue'),
    BIcon,
    // eslint-disable-next-line vue/no-unused-components
    BIconArrowDownCircleFill,
    // eslint-disable-next-line vue/no-unused-components
    BIconArrowRightCircleFill,
    BCard,
    BCardText
  },
  props: {
    label: {
      type: String,
      default: 'No Section Label'
    },
    coll: {
      type: TrackCollection,
      default: null
    },
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      myDataList: this.coll.members(),
      expanded: !this.collapsed
    }
  },
  computed: {
    expandIcon: function () {
      return (this.expanded ? 'ArrowDownCircleFill' : 'ArrowRightCircleFill')
    },
    collapseId: function () {
      const origLabel = this.label.replace(/\s+/, '-').toLowerCase()
      return `toggle-${origLabel}`
    }
  },
  methods: {
    toggleMemberVisibility: function () {
      this.expanded = !(this.expanded)
    }
  }
}
</script>
