<template>
  <div>
    <!-- <TrackHeader /> -->
    <b-row>
      <b-col>
        <div class="px-3 py-3 pt-md-5 pb-md-4 mx-auto">
          <b-card
            bg-variant="light"
            border-variant="primary"
            :title="label"
            class="my-2"
          >
            <b-card-text>
              <b-button @click="toggleMemberVisibility">
                <b-icon :icon="expandIcon" />
              </b-button>
              {{ Math.round(coll.distance() / 1000) }} km total
            </b-card-text>
          </b-card>
          <div v-if="expanded">
            <TrackCard
              v-for="item in myDataList"
              :key="item.id"
              :track="item"
            />
          </div>
        </div>
      </b-col>
    </b-row>
  </div>
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
    }
  },
  data () {
    return {
      myDataList: this.coll.members(),
      expandIcon: 'ArrowDownCircleFill',
      expanded: true
    }
  },
  methods: {
    toggleMemberVisibility: function () {
      if (this.expanded) {
        // toggle to collapsed
        this.expandIcon = 'ArrowRightCircleFill'
        this.expanded = false
      } else {
        // toggle to expand
        this.expandIcon = 'ArrowDownCircleFill'
        this.expanded = true
      }
    }
  }
}
</script>
