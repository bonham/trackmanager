<template>
  <track-manager-nav-bar :sid="sid">
    <div v-if="buttonsLoading" class="placeholder-glow d-flex flex-row" style="width: 20em;">
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
      <b-button class="placeholder bg-secondary flex-fill m-2"></b-button>
    </div>
    <div v-else class="year-navbar">
      <b-button v-if="buttonAll" class="m-2 button-year-navbar" @click="loadAllTracks()">All</b-button>
      <b-button v-if="buttonAllInView" class="m-2 button-year-navbar" @click="loadAllTracksinView()">All in
        view</b-button>
      <b-button v-for="year in years" :key="year" class="m-2 button-year-navbar" @click="loadTracksOfYear(year, false)">
        {{ year === 0 ? "No date" : year }}
      </b-button>
    </div>
    <div class="d-flex flex-column flex-grow-1">
      <map-component :sid="sid" />
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import { BButton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import MapComponent from '@/components/MapComponent.vue'
import { TrackCollection } from '@/lib/Track'
import { getAllTracks } from '@/lib/trackServices'
import { useMapStateStore } from '@/stores/mapstate'
import { useConfigStore } from '@/stores/configstore'

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
const buttonAllInView = ref(false)
const buttonAll = ref(true)

// initialization
const configStore = useConfigStore()

configStore.loadConfig(props.sid)
  .then(async () => {
    const initialState = configStore.get('TRACKMAP_INITIALVIEW')
    if (initialState === "ALL") {

      buttonsLoading.value = false
      loadAllTracks()

    } else if (initialState === "LATEST_YEAR") {

      await getYears()
      buttonsLoading.value = false
      if (years.value.length > 0) {
        const mostRecentYear = years.value[0]
        loadTracksOfYear(mostRecentYear, true)
      }
    }
  })
  .catch((e) => console.error("Error when loading store", e))

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
    .catch((e: Error) => { console.log("Error in getYears", e) })
}

function loadAllTracks() {
  mapStateStore.loadCommand = {
    command: 'all',
    zoomOut: true
  }
}

function loadAllTracksinView() {
  mapStateStore.loadCommand = {
    command: 'bbox',
    completed: false
  }
}

function loadTracksOfYear(year: number, zoomOut: boolean) {
  mapStateStore.loadCommand = {
    command: 'year',
    payload: year,
    zoomOut
  }
}

</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}
</style>
