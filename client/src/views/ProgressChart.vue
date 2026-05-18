<template>
  <track-manager-nav-bar :sid="sid">
    <div class="d-flex flex-row border-top border-bottom border-0">
      <button type="button" class="btn btn-outline-secondary m-2 expandbutton"
        @click="console.log('Expand/collapse not implemented yet')">
        ThisButton</button>
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
import { generateChartDataSets } from '@/lib/progress/progressChart'
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
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

// constants
const MAX_LINES_WITH_FILTER = 5

// reactives and dom refs
const filterType = ref<PChartSortType>('highest_progress')
const loading = ref(true)
const canvasref = ref<(null | HTMLCanvasElement)>(null)

function tracksByYear(loadedTracks: Track[]): TracksByYearDict {
  const trackFlatList = _.values(loadedTracks)
  return _.groupBy(trackFlatList, (x: Track) => x.year())
}


// load tracks async
const allTracksPromise = getAllTracks(props.sid)

// generate empty chart
onMounted(() => {
  nextTick(async () => {

    // should be defined after mount
    if (canvasref.value !== null) {

      const mychart = new Chart<PChartTType, ExtendedPChartDataPoint[], PChartTLabel>(
        canvasref.value,
        chartConfig
      )

      // wait for loading of tracks to complete
      const allTracks = await allTracksPromise
      const tby = tracksByYear(allTracks)
      const pgDs = generateChartDataSets(tby, filterType.value, MAX_LINES_WITH_FILTER)

      // update chart data
      mychart.data.datasets = pgDs
      mychart.update()
      loading.value = false

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
</style>
