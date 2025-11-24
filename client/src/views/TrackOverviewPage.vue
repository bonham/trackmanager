<template>
  <track-manager-nav-bar :sid="sid">
    <div class="border-top border-bottom border-0">
      <div class="d-flex flex-row">
        <button type="button" class="btn btn-outline-secondary m-2 expandbutton" @click="toggleFullExpand">
          {{ expandPressed ? "Collapse" : "Expand" }}</button>
        <form @submit.prevent>
          <input v-model="searchStore.searchText" v-focus class="form-control m-2" placeholder="Search tracks..."
            @keyup.enter="toggleFullExpand" />
        </form>
      </div>
    </div>
    <div class="px-2">
      <div>
        <div>
          <span v-if="loading">Loading <b-spinner small />
          </span>
        </div>
        <div>
          <TrackSection v-for="trCol in trackCollections" :key="trCol.year"
            v-model:visible="collectionExpandState[trCol.year]" :coll="trCol.collection"
            :label="trCol.year === 0 ? 'No date' : trCol.year.toString()" :sid="sid" />
        </div>
      </div>
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">

import TrackSection from '@/components/TrackSection.vue'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { Track, TrackCollection } from '@/lib/Track'
import { getAllTracks } from '@/lib/trackServices'
import { BSpinner } from 'bootstrap-vue-next'
import _ from 'lodash'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useSearchStore } from '@/stores/search'

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const searchStore = useSearchStore()

const loadedTracks: Ref<Track[]> = ref([])
const loading = ref(true)

type YearState = Record<number, boolean>;
const collectionExpandState = ref<YearState>({})
const expandPressed = ref(false)

function toggleFullExpand() {
  const shouldExpand = !expandPressed.value

  yearList.value.forEach(y => {
    console.log('expanding', y)
    collectionExpandState.value[y] = shouldExpand
  })
  expandPressed.value = shouldExpand

}

const tracksByYear = computed(() => {
  const trackFlatList = _.values(loadedTracks.value)
  return _.groupBy(trackFlatList, (x: Track) => x.year())

})

const yearList = computed(() => {
  const ylStrings = _.keys(tracksByYear.value)
  const yl = ylStrings.map(e => parseInt(e))
  yl.sort().reverse()
  return yl
})

const maxYear = computed(() => Math.max(...yearList.value))

const trackCollections = computed(() => {
  const r: { year: number, collection: TrackCollection }[] = []
  yearList.value.forEach(y => {
    let tracksToDisplay: Track[];

    if (searchStore.searchText === '') {
      tracksToDisplay = tracksByYear.value[y]
    } else {
      tracksToDisplay = tracksByYear.value[y].filter(t => (
        (t.name ?? '').toLowerCase().includes(searchStore.searchText.toLowerCase())
      ))
    }
    if (tracksToDisplay.length > 0) { // do not create empty collections
      const tc = new TrackCollection(tracksToDisplay)
      r.push({
        year: y,
        collection: tc
      })
    }

  })
  return r

})



async function runOnCreate() {
  loadedTracks.value = await getAllTracks(props.sid)
  loading.value = false

  // initial expand/collapse state
  const my = maxYear.value

  yearList.value.forEach(y => {
    collectionExpandState.value[y] = (y === my) // only expand the max year initially
  })
}

runOnCreate().catch((error) => console.log(error))

const vFocus = {
  mounted(el: HTMLElement) {
    el.focus()
  }
}

</script>

<style lang="css" scoped>
.filter {
  margin: 0rem;
  padding: 0.875rem 0.75rem !important;
  font-size: 1rem;
  border: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color);

}

.expandbutton {
  min-width: 10ch;
}
</style>
