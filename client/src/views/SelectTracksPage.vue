<template>
  <b-container id="root" class="d-flex flex-column vh-100">
    <track-manager-nav-bar :sid="sid" />
    <!-- <div v-if="buttonsLoading" class="year-navbar"> -->
    <div v-if="buttonsLoading" class="placeholder-glow d-flex flex-row" style="width: 20em;">
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
    </div>
    <div v-else class="year-navbar">
      <b-button v-for="year in years" :key="year" class="m-2 button-year-navbar" @click="loadTracksOfYear(year)">
        {{ year === 0 ? "No date" : year }}
      </b-button>
      <b-button v-if="showAllButton" class="m-2 button-year-navbar" @click="loadAllTracks()">
        All
      </b-button>
    </div>
    <div class="d-flex flex-column flex-grow-1">
      <filtered-map :sid="sid" />
    </div>
  </b-container>
</template>

<script lang="ts" setup>
import { BContainer, BButton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredMap from '@/components/FilteredMap.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices'
import { useTracksStore } from '@/storepinia'
import { ref } from 'vue'
import type { Ref } from 'vue'

const store = useTracksStore()

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

// reactive data
const years: Ref<number[]> = ref([])
const buttonsLoading = ref(true)
const showAllButton = ref(false)

// initialization
getYears().then(() => {
  buttonsLoading.value = false
  if (years.value.length > 0) {
    loadTracksOfYear(years.value[0])
  }
})

async function getYears() {
  await getAllTracks(props.sid).then((trackList) => {
    const tColl = new TrackCollection(trackList)
    years.value = tColl.yearList().sort((a, b) => b - a)
  })
}

function loadTracksOfYear(year: number) {
  // call loadTracksAndRedraw action from store while injecting the load function
  const sid = props.sid
  const loadFunction = function () { return getTracksByYear(year, sid) }
  store.loadTracksAndRedraw(loadFunction).catch((e: any) => console.error('Error loading tracks by year', e))
}

function loadAllTracks() {
  const sid = props.sid
  const loadFunc = () => getAllTracks(sid)
  store.loadTracksAndRedraw(loadFunc).catch((e: any) => console.error('Error loading all tracks', e))
}


</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}
</style>
