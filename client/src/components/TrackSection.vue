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
              {{ Math.round(coll.distance() / 1000) }} km total
            </b-card-text>
          </b-card>
          <div>
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
      myDataList: this.coll.members()
    }
  }
}
</script>
