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
      <b-button class="m-2 button-year-navbar" @click="loadAllTracksinView()">All in view</b-button>
      <b-button v-for="year in years" :key="year" class="m-2 button-year-navbar" @click="loadTracksOfYear(year, false)">
        {{ year === 0 ? "No date" : year }}
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
import { getAllTracks } from '@/lib/trackServices'
import { useMapStateStore } from '@/stores/mapstate'
import { ref } from 'vue'

const mapStateStore = useMapStateStore()


const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

// reactive data
const years = ref<number[]>([])
const buttonsLoading = ref(true)

// initialization
getYears()
  .then(() => {
    buttonsLoading.value = false
    if (years.value.length > 0) {
      const mostRecentYear = years.value[0]
      loadTracksOfYear(mostRecentYear, true)
    }
  })
  .catch((error) => { console.error(error) })

async function getYears() {
  await getAllTracks(props.sid)
    .then((trackList) => {
      const tColl = new TrackCollection(trackList)
      years.value = tColl.yearList().sort((a, b) => b - a)
    })
    .catch((e: any) => { console.log("Error in getYears", e) })
}

function loadTracksOfYear(year: number, zoomOut: boolean) {
  mapStateStore.loadCommand = {
    command: 'year',
    payload: year,
    zoomOut
  }
}

function loadAllTracksinView() {

  mapStateStore.loadCommand = {
    command: 'bbox',
    completed: false
  }

}


</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}
</style>
