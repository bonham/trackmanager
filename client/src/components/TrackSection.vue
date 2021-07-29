<template>
  <b-row>
    <b-col class="px-3 py-3 pt-md-5 pb-md-4 mx-auto">
      <b-card
        bg-variant="light"
        :title="label"
        class="my-2"
        @click="toggleMemberVisibility"
      >
        <b-card-text>
          <b-button
            :class="expanded ? null : 'collapsed'"
            :aria-expanded="expanded ? 'true' : 'false'"
            :aria-controls="collapseId"
          >
            <b-icon
              :icon="expandIcon"
            />
          </b-button>
          <span class="mx-2">
            {{ Math.round(coll.distance() / 1000) }} km total
          </span>
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
    </b-col>
  </b-row>
</template>

<script>
// import TrackHeader from '@/components/TrackHeader.vue'
import TrackCard from '@/components/TrackCard.vue'
import { TrackCollection } from '@/lib/Track.js'

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
