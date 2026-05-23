<template>
  <track-manager-nav-bar :sid="sid">
    <div class="d-flex flex-row border-top border-bottom border-0">
      <button type="button" class="filterbuttons btn m-2" :class="newestClass" @click="toggleNewest()">
        Newest</button>
      <button type="button" class="filterbuttons btn m-2" :class="bestClass" @click="toggleBest()">
        Best</button>
    </div>
    <div id="canvasparent" class="d-flex flex-row flex-grow-1 mh-100 justify-content-center align-items-center w-100">
      <div id="canvas-wrapper" class="mh-100 mw-100 w-auto h-100" style="aspect-ratio: 3/4;">
        <canvas id="acquisitions" ref="canvasref"></canvas>
        <!-- <div v-if="loading" class="myspinner" role="status" aria-label="Loading chart">
          <b-spinner />
        </div> -->
      </div>
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import { reportError } from '@/stores/errorstore'
import { chartConfig } from '@/lib/progress/progressChartConfig'
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
import 'chartjs-adapter-luxon'
import zoomPlugin from 'chartjs-plugin-zoom'

Chart.register(
  LineController,
  LineElement,
  PointElement,
  Colors,
  TimeScale,
  LinearScale,
  Legend,
  Tooltip
)
Chart.register(zoomPlugin)

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

// reactive state and DOM references
const loading = ref(true)
const canvasref = ref<HTMLCanvasElement | null>(null)
const filterState = ref(new FilterButtonState())

const newestClass = computed(() => filterState.value.newestButtonClass())
const bestClass = computed(() => filterState.value.bestButtonClass())

// Persist track loading so the chart uses the same data from one request
const allTracksPromise = getAllTracks(props.sid)
let chart: ProgressChartType | null = null
let allTracks: Track[] = []

// Helpers for filter state and chart generation
function numYearLines(): number {
  return filterState.value.filterActive() ? MAX_YEARLINES_WITH_FILTER : 0
}

function filterType(): PChartSortType {
  // if best is inactive, it does not matter if newest is active or not, it will just show the newest years according to limit. 
  return filterState.value.bestActive ? 'highest_progress' : 'newest_year'
}

function tracksByYear(loadedTracks: Track[]): TracksByYearDict {
  const trackFlatList = _.values(loadedTracks)
  return _.groupBy(trackFlatList, (x: Track) => x.year())
}

function updateChart(ch: ProgressChartType | null, tracks: Track[]) {
  if (ch === null) {
    return
  }

  const trByYear = tracksByYear(tracks)
  const chartDataSets = generateChartDataSets(trByYear, filterType(), numYearLines())
  ch.data.datasets = chartDataSets
  ch.update()
}

// button handlers
function toggleNewest() {
  filterState.value.toggleNewest()
  updateChart(chart, allTracks)
}

function toggleBest() {
  filterState.value.toggleBest()
  updateChart(chart, allTracks)
}

// Lifecycle: initialize chart after mount and update when data loads
onMounted(() => {
  nextTick(async () => {
    if (canvasref.value === null) {
      reportError('Canvas null')
      return
    }

    chart = new Chart<PChartTType, ExtendedPChartDataPoint[], PChartTLabel>(canvasref.value, chartConfig)

    try {
      allTracks = await allTracksPromise
      loading.value = false
      updateChart(chart, allTracks)
    } catch (err) {
      reportError('Failed to load tracks', err)
    }
  }).catch((err) => {
    reportError('Error in nextTick', err)
  })
})
</script>

<style scoped>
#acquisitions {
  /* make the canvas take all available space in the wrapper, but maintain aspect ratio */
  width: 100% !important;
  height: 100% !important;
}

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
