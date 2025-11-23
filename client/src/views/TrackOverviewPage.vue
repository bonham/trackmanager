<template>
  <track-manager-nav-bar :sid="sid">
    <div class="border-top border-bottom border-0">
      <div class="d-flex flex-row">
        <button type="button" class="btn btn-outline-secondary m-2">Expand</button>
        <form>
          <input v-model="searchStore.searchText" class="form-control m-2" placeholder="Search tracks..." />
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
          <TrackSection v-for="trCol in trackCollections" :key="trCol.year" :coll="trCol.collection"
            :label="trCol.year === 0 ? 'No date' : trCol.year.toString()" :visible="trCol.year === maxYear"
            :sid="sid" />
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
    const tc = new TrackCollection(tracksToDisplay)
    r.push({
      year: y,
      collection: tc
    })
  })
  return r

})



async function runOnCreate() {
  loadedTracks.value = await getAllTracks(props.sid)
  loading.value = false
}

runOnCreate().catch((error) => console.log(error))

</script>

<style lang="css" scoped>
.filter {
  margin: 0rem;
  padding: 0.875rem 0.75rem !important;
  font-size: 1rem;
  border: var(--bs-border-width) var(--bs-border-style) var(--bs-border-color);

}
</style>
