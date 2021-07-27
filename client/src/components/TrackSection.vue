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
              <b-button
                :class="visible ? null : 'collapsed'"
                :aria-expanded="visible ? 'true' : 'false'"
                aria-controls="toggle-2021"
                @click="visible = !visible"
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
            v-model="visible"
          >
            <TrackCard
              v-for="item in myDataList"
              :key="item.id"
              :track="item"
            />
          </b-collapse>
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
      expanded: true,
      visible: true
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
