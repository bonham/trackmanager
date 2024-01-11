<template>
  <track-manager-nav-bar :sid="sid">
    <div class="px-2">
      <div>
        <div>
          <span v-if="loading">Loading <b-spinner small />
          </span>
        </div>
        <div>
          <TrackSection v-for="trCol in trackCollections" :key="trCol.year" :coll="trCol.collection"
            :label="trCol.year === '0' ? 'No date' : trCol.year" :initially-collapsed="isYearCollapsed(trCol.year)"
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

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const loadedTracks: Ref<Track[]> = ref([])
const loading = ref(true)

const tracksByYear = computed(() => {
  const trackFlatList = _.values(loadedTracks.value)
  return _.groupBy(trackFlatList, (x: Track) => x.year())

})

const yearList = computed(() => {
  const yl = _.keys(tracksByYear.value)
  yl.sort().reverse()
  return yl
})

const trackCollections = computed(() => {
  const r: { year: string, collection: TrackCollection }[] = []
  yearList.value.forEach(y => {
    const tc = new TrackCollection(tracksByYear.value[y])
    r.push({
      year: y,
      collection: tc
    })
  })
  return r

})

function isYearCollapsed(thisYear: string) {
  const firstYearInCollection = trackCollections.value[0].year
  return thisYear !== firstYearInCollection
}

async function runOnCreate() {
  loadedTracks.value = await getAllTracks(props.sid)
  loading.value = false
}

runOnCreate().catch((error) => console.log(error))

</script>
