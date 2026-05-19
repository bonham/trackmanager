<template>
  <track-manager-nav-bar :sid="sid">
    <div class="d-flex flex-row border-top border-bottom border-0">
      <button type="button" class="filterbuttons btn m-2" :class="newestClass" @click="toggleNewest()">
        Newest</button>
      <button type="button" class="filterbuttons btn m-2" :class="bestClass" @click="toggleBest()">
        Best</button>
    </div>
    <div class="d-flex flex-column flex-grow-1">
      <canvas id="acquisitions" ref="canvasref"></canvas>
      <div v-if="loading" class="myspinner">
        <b-spinner />
      </div>
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import { reportError } from '@/stores/errorstore';
import { chartConfig } from '@/lib/progress/progressChartConfig';
import { generateChartDataSets, FilterButtonState } from '@/lib/progress/progressChart'
import type { TracksByYearDict, ExtendedPChartDataPoint, PChartTLabel, PChartTType, PChartSortType } from '@/lib/progress/progressChartTypes'
import _ from 'lodash'

// chartjs
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  Colors,
  TimeScale,
  LinearScale,
  Legend,
  Tooltip
} from 'chart.js'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  Colors,
  TimeScale,
  LinearScale,
  Legend,
  Tooltip
);
import 'chartjs-adapter-luxon';

import zoomPlugin from 'chartjs-plugin-zoom';
Chart.register(zoomPlugin);

// internals
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { Track } from '@/lib/Track'
import { getAllTracks } from '@/lib/trackServices'
import { BSpinner } from 'bootstrap-vue-next'
import { ref, onMounted, nextTick, computed } from 'vue'

type ProgressChartType = Chart<PChartTType, ExtendedPChartDataPoint[], PChartTLabel>

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

// constants
const MAX_YEARLINES_WITH_FILTER = 5

// reactives and dom refs
const loading = ref(true)
const canvasref = ref<(null | HTMLCanvasElement)>(null)


const filterState = ref(new FilterButtonState())

const newestClass = computed(() => filterState.value.newestButtonClass())
const bestClass = computed(() => filterState.value.bestButtonClass())

function numYearLines() {
  return filterState.value.filterActive() ? MAX_YEARLINES_WITH_FILTER : 0
}

function filterType(): PChartSortType {
  if (filterState.value.bestActive) {
    return "highest_progress"
  } else {
    return "newest_year"
  }
}

function tracksByYear(loadedTracks: Track[]): TracksByYearDict {
  const trackFlatList = _.values(loadedTracks)
  return _.groupBy(trackFlatList, (x: Track) => x.year())
}

// load tracks async
const allTracksPromise = getAllTracks(props.sid)

let chart: ProgressChartType | null = null
let allTracks: Track[] = []

function updateChart(ch: ProgressChartType | null, tracks: Track[]) {
  if (ch !== null) {

    const trByYear = tracksByYear(tracks)
    const chartDataSets = generateChartDataSets(trByYear, filterType(), numYearLines())
    ch.data.datasets = chartDataSets
    ch.update()
  }
}

function toggleNewest() {
  filterState.value.toggleNewest()
  updateChart(chart, allTracks)
}

function toggleBest() {
  filterState.value.toggleBest()
  updateChart(chart, allTracks)
}

// generate empty chart
onMounted(() => {
  nextTick(async () => {

    // should be defined after mount
    if (canvasref.value !== null) {

      chart = new Chart<PChartTType, ExtendedPChartDataPoint[], PChartTLabel>(
        canvasref.value,
        chartConfig
      )

      // wait for loading of tracks to complete
      allTracks = await allTracksPromise
      loading.value = false
      updateChart(chart, allTracks)

    } else {
      reportError("Canvas null")
    }
  }).catch((err) => {
    reportError("Error in nextTick", err)
  })
})

</script>

<style scoped>
.myspinner {
  position: absolute;

  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

}

.filterbuttons {
  /* disable hover effect */

  &:hover {
    background-color: var(--bs-btn-bg);
    color: var(--bs-btn-color);
  }

  &:focus {
    background-color: var(--bs-btn-bg);
    color: var(--bs-btn-color);
  }

  &.active {
    &:hover {
      background-color: var(--bs-btn-active-bg);
      color: var(--bs-btn-active-color);
    }

    &:focus {
      background-color: var(--bs-btn-active-bg);
      color: var(--bs-btn-active-color);
    }
  }
}
</style>
