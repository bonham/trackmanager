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

<script setup lang="ts">
// import TrackHeader from '@/components/TrackHeader.vue'
import { ref, computed } from 'vue'
import TrackCard from '@/components/TrackCard.vue'
import { TrackCollection } from '@/lib/Track'
import {
  BCard, BCardText,
  BRow, BCol, BButton, BCollapse
} from 'bootstrap-vue-next'

const props = defineProps({
  label: {
    type: String,
    default: 'No Section Label'
  },
  coll: {
    type: TrackCollection,
    default: null
  },
  initiallyCollapsed: {
    type: Boolean,
    default: false
  },
  sid: {
    type: String,
    default: ''
  }
})

const myDataList = ref(props.coll.members())
const expanded = ref(!props.initiallyCollapsed) // initial state
const everVisible = ref(!props.initiallyCollapsed) // initial state

const collapseId = computed(() => {
  const origLabel = props.label.replace(/\s+/, '-').toLowerCase()
  return `toggle-${origLabel}`
})

function toggleMemberVisibility() {
  const toBeValue = !(expanded.value)
  // render if it was not rendered before, but never destroy again
  everVisible.value = everVisible.value || toBeValue
  // expand after rendering
  expanded.value = toBeValue
}
</script>
