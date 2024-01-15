<template>
  <track-manager-nav-bar :sid="sid">
    <div v-if="buttonsLoading" class="placeholder-glow d-flex flex-row" style="width: 20em;">
      <button class="btn placeholder btn-outline-secondary flex-fill m-2">..</button>
      <button class="btn placeholder btn-outline-secondary flex-fill m-2">..</button>
      <button class="btn placeholder btn-outline-secondary flex-fill m-2">..</button>
      <button class="btn placeholder btn-outline-secondary flex-fill m-2">..</button>
    </div>
    <div v-else class="year-navbar border-bottom border-top">
      <button v-if="buttonAll" class="btn m-2 button-year-navbar" :class="activeClass(buttonAllActive)"
        @click="loadAllTracks()">All</button>
      <button v-if="buttonAllInView" class="btn m-2 button-year-navbar" :class="activeClass(buttonAllInViewActive)"
        @click=" loadAllTracksinView()">All in
        view</button>
      <button v-for=" year  in  years " :key="year" class="btn m-2 button-year-navbar"
        :class="year in buttonYActive ? activeClass(buttonYActive[year]) : activeClass(false)"
        @click="loadTracksOfYear(year, false)">
        {{ year === 0 ? "No date" : year }}
      </button>
    </div>
    <div class="d-flex flex-column flex-grow-1">
      <map-component :sid="sid" />
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
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
const buttonsLoading = ref(false)
const buttonAllInView = ref(false)
const buttonAll = ref(true)

// buttons active
const buttonAllActive = ref(false)
const buttonAllInViewActive = ref(false)
const buttonYActive = ref<Record<number, boolean>>({})
function activeClass(active: boolean) {
  return active ? "btn-secondary" : "btn-outline-secondary"
}

// initialization
const configStore = useConfigStore()

configStore.loadConfig(props.sid)
  .then(async () => {
    const initialState = configStore.get('TRACKMAP_INITIALVIEW')
    if (initialState === "ALL") {

      // async possible
      getYears()
        .then(() => { buttonsLoading.value = false })
        .catch((e) => console.error("Error while loading years", e))

      loadAllTracks()

    } else if (initialState === "LATEST_YEAR") {

      // not async pls
      await getYears()
      buttonsLoading.value = false
      if (years.value.length > 0) {
        const mostRecentYear = years.value[0]
        loadTracksOfYear(mostRecentYear, true)
      }
    }
  })
  .catch((e) => console.error("Error when loading store", e))

async function getYears() {
  await getAllTracks(props.sid)
    .then((trackList) => {
      const tColl = new TrackCollection(trackList)
      years.value = tColl.yearList().sort((a, b) => b - a)
      // button active state
      years.value.forEach((y) => {
        buttonYActive.value[y] = false
      })
    })
    .catch((e: Error) => { console.log("Error in getYears", e) })
}

function loadAllTracks() {
  mapStateStore.loadCommand = {
    command: 'all',
    zoomOut: true
  }
  setAllButtonsInactive()
  buttonAllActive.value = true
}

function loadAllTracksinView() {
  mapStateStore.loadCommand = {
    command: 'bbox',
    completed: false
  }
  setAllButtonsInactive()
  buttonAllInViewActive.value = true
}

function loadTracksOfYear(year: number, zoomOut: boolean) {
  mapStateStore.loadCommand = {
    command: 'year',
    payload: year,
    zoomOut
  }
  setAllButtonsInactive()
  buttonYActive.value[year] = true
}

function setAllButtonsInactive() {
  buttonAllActive.value = false
  buttonAllInViewActive.value = false
  Object.keys(buttonYActive.value).forEach((p) => {
    const keyNumber = Number.parseInt(p)
    buttonYActive.value[keyNumber] = false
  })
}

</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}

/* CSS for smaller screens */
@media (max-width: 1000px) {
  .button-year-navbar {
    flex: 0 0 auto;
    height: max-content;
    white-space: nowrap;
  }

  .year-navbar {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    /* Enable horizontal scroll */
  }
}
</style>
