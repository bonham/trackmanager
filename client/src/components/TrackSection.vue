<!-- eslint-disable vue/first-attribute-linebreak -->
<template>
  <div>
    <b-card bg-variant="light" class="my-2" @click="toggle">
      <b-card-text>
        <b-row class="align-items-center">
          <b-col cols="9" class="d-flex flex-row align-items-center">
            <b-button :class="visible ? null : 'collapsed'" :aria-expanded="visible ? 'true' : 'false'"
              :aria-controls="collapseId">
              <i-bi-arrow-down-circle-fill v-if="visible" />
              <i-bi-arrow-right-circle v-else />
            </b-button>
            <h4 class="mx-2 my-0">
              {{ label }} ({{ coll.tlist.length }})
            </h4>
            <div class="mx-2">
              {{ Math.round(coll.distance() / 1000) }} km
            </div>
          </b-col>
          <b-col cols="3" />
        </b-row>
      </b-card-text>
    </b-card>
    <b-collapse :id="collapseId" ref="myCollapse" v-model="visible" data-testid="testbcollapse" :lazy="true">
      <TrackCard v-for="item in myDataList" :key="item.id" :track="item" :sid="sid" />
    </b-collapse>
  </div>
</template>

<script setup lang="ts">
// import TrackHeader from '@/components/TrackHeader.vue'
import { toRef, ref, computed, defineExpose } from 'vue'
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

// Ref to the collapse component
// This is used to control the collapse programmatically if needed
const myCollapse = ref<InstanceType<typeof BCollapse> | null>(null)

const show = () => myCollapse.value?.show()
const hide = () => myCollapse.value?.hide()
const toggle = () => myCollapse.value?.toggle()

// Expose methods to the parent component
defineExpose({
  show,
  hide,
  toggle
})

// needed for v-model binding
const visible = ref(!props.initiallyCollapsed) // initial state

//??
const collRef = toRef(props, 'coll')
const myDataList = computed(() => collRef.value.members())

// Computed property to generate a unique collapse ID based on the label
const collapseId = computed(() => {
  const origLabel = props.label.replace(/\s+/, '-').toLowerCase()
  return `toggle-${origLabel}`
})


</script>
