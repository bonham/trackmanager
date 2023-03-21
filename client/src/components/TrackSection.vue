<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div>
    <b-card bg-variant="light" class="my-2">
      <b-card-text>
        <b-row class="align-items-center">
          <b-col cols="9" class="d-flex flex-row align-items-center">
            <b-button :class="expanded ? null : 'collapsed'" :aria-expanded="expanded ? 'true' : 'false'"
              :aria-controls="collapseId" @click="toggleMemberVisibility">
              <i-bi-arrow-down-circle-fill v-if="expanded" />
              <i-bi-arrow-right-circle v-else />
            </b-button>
            <h4 class="mx-2 my-0">
              {{ label }}
            </h4>
            <div class="mx-2">
              {{ Math.round(coll.distance() / 1000) }} km total
            </div>
          </b-col>
          <b-col cols="3" />
        </b-row>
      </b-card-text>
    </b-card>
    <b-collapse :id="collapseId" :visible="expanded">
      <div v-if="everVisible">
        <TrackCard v-for="item in myDataList" :key="item.id" :track="item" :sid="sid" />
      </div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
// import TrackHeader from '@/components/TrackHeader.vue'
import TrackCard from '@/components/TrackCard.vue'
import { TrackCollection } from '@/lib/Track'
import {
  BCard, BCardText,
  BRow, BCol, BButton, BCollapse
} from 'bootstrap-vue-next'

export default {
  name: 'TrackSection',
  components: {
    TrackCard,
    BCard,
    BCardText,
    BRow,
    BCol,
    BButton,
    BCollapse
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
    },
    sid: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      myDataList: this.coll.members(),
      expanded: !this.collapsed,
      everVisible: !this.collapsed
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
      const toBeValue = !(this.expanded)
      // render if it was not rendered before, but never destroy again
      this.everVisible = this.everVisible || toBeValue
      // expand after rendering
      this.expanded = toBeValue
    }
  }
}
</script>
