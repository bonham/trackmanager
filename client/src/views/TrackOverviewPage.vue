<template>
  <track-manager-nav-bar :sid="sid">
    <div class="border-top border-bottom border-0">
      <div class="d-flex flex-row">
        <button type="button" class="btn btn-outline-secondary m-2 expandbutton" @click="toggleFullExpand">
          {{ trackOverviewStore.expandPressed ? "Collapse" : "Expand" }}</button>
        <form @submit.prevent>
          <input v-model="searchStore.searchText" v-focus class="form-control m-2" placeholder="Search tracks..."
            @keyup.enter="toggleFullExpand" />
        </form>
      </div>
    </div>
    <div ref="scrollableContainer" class="px-2 flex-grow-1 overflow-auto" style="min-height: 0" @scroll="handleScroll">
      <div>
        <div>
          <span v-if="loading">Loading <b-spinner small />
          </span>
        </div>
        <div>
          <TrackSection v-for="trCol in trackCollections" :key="trCol.year"
            v-model:visible="trackOverviewStore.collectionExpandState[trCol.year]" :coll="trCol.collection"
            :label="trCol.year === 0 ? 'No date' : trCol.year.toString()" :sid="sid"
            :selected-track-id="trackOverviewStore.selectedTrackId" />
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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useTrackOverviewStore } from '@/stores/trackOverview'

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const searchStore = useSearchStore()
const trackOverviewStore = useTrackOverviewStore()

const loading = ref(true)
const scrollableContainer = ref<HTMLElement | null>(null)

type YearState = Record<number, boolean>;

function toggleFullExpand() {
  const shouldExpand = !trackOverviewStore.expandPressed

  yearList.value.forEach(y => {
    console.log('expanding', y)
    trackOverviewStore.collectionExpandState[y] = shouldExpand
  })
  trackOverviewStore.setExpandPressed(shouldExpand)
}

const tracksByYear = computed(() => {
  const trackFlatList = _.values(trackOverviewStore.loadedTracks)
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
      tracksToDisplay = tracksByYear.value[y] ?? []
    } else {
      tracksToDisplay = (tracksByYear.value[y] ?? []).filter(t => (
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
  // Load tracks only if not already loaded (first visit)
  if (trackOverviewStore.loadedTracks.length === 0) {
    const tracks = await getAllTracks(props.sid)
    trackOverviewStore.setLoadedTracks(tracks)

    // initial expand/collapse state - only expand the max year initially
    const my = maxYear.value
    const initialState: YearState = {}
    yearList.value.forEach(y => {
      initialState[y] = (y === my)
    })
    trackOverviewStore.setCollectionExpandState(initialState)
  }

  loading.value = false

  // Restore scroll position after DOM updates.
  await nextTick()
  if (scrollableContainer.value && trackOverviewStore.scrollPosition > 0) {
    scrollableContainer.value.scrollTop = trackOverviewStore.scrollPosition
  }
}

function handleScroll() {
  if (scrollableContainer.value) {
    trackOverviewStore.setScrollPosition(scrollableContainer.value.scrollTop)
  }
}

onMounted(() => {
  runOnCreate().catch((error) => console.log(error))
})

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
