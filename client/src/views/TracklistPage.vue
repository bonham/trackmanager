<template>
  <b-container id="root" class="d-flex flex-column">
    <track-manager-nav-bar :sid="sid" />
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
    <div ref="outerSplitFrame" class="flex-grow-1 flex-column d-flex">
      <filtered-track-list />
    </div>
  </b-container>
</template>

<script lang="ts" setup>
import { BContainer, BButton } from 'bootstrap-vue-next'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import FilteredTrackList from '@/components/FilteredTrackList.vue'
import { TrackCollection } from '@/lib/Track'
import { getTracksByYear, getAllTracks } from '@/lib/trackServices'
import { ref } from 'vue'
import { useTracksStore } from '@/storepinia'
const store = useTracksStore()

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})



const years = ref<number[]>([])
const buttonsLoading = ref(true)
const showAllButton = ref(false)

getYears()
  .then(() => {
    buttonsLoading.value = false
    if (years.value.length > 0) {
      loadTracksOfYear(years.value[0])
    }
  })
  .catch((e) => { console.error(e) })


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
  store.loadTracks(loadFunction).catch((e: any) => console.error('Error loading tracks by year', e))
}

function loadAllTracks() {
  const sid = props.sid
  const loadFunc = () => getAllTracks(sid)
  store.loadTracks(loadFunc).catch((e: any) => console.error('Error loading all tracks', e))
}


</script>
<style>
.button-year-navbar {
  height: max-content;
  white-space: nowrap;
}
</style>
