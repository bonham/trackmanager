<template>
  <track-manager-nav-bar :sid="sid">
    <div class="d-flex flex-column flex-grow-1 px-2">
      <div class="d-flex flex-column">
        <span v-if="loading">Loading <b-spinner small />
        </span>
      </div>
      <div class="d-flex flex-column flex-grow-1">
        <canvas id="acquisitions" ref="canvasref"></canvas>
      </div>
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import { reportError } from '@/stores/errorstore';
import { generateChartDataSets, type TracksByYearDict, type ChartDataPoint } from '@/lib/progress/progressChart'
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
import { DateTime } from 'luxon';

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

// reactives and dom refs
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

      const mychart = new Chart<"line", { x: DateTime; y: number; }[], DateTime>(
        canvasref.value,
        {
          type: 'line',
          data: {
            datasets: [],
          },
          options: {
            maintainAspectRatio: false,
            scales: {
              x: {
                type: "time",
                time: {
                  //  tooltipFormat: 'ccc MMM d',
                  displayFormats: {
                    month: 'MMM',
                    year: ''
                  },
                  unit: 'month'
                },
                min: '2024-01-01',
                max: '2025-01-02',
                title: {
                  display: true,
                  text: "Day in year"
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Mileage'
                },
                ticks: {
                  callback: (value) => `${Math.round(value as number)} km`
                }
              }
            },
            plugins: {
              tooltip: {
                boxPadding: 10,
                callbacks: {
                  title: function (dataset) {
                    return (dataset[0]?.raw as ChartDataPoint).originalDate.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
                  },
                  label: function (item) {
                    return Math.round((item.raw as ChartDataPoint).step) + " km"
                  },
                  afterLabel: function (item) {
                    return (item.raw as ChartDataPoint).name
                  }
                }
              },
              zoom: {
                zoom: {
                  wheel: {
                    enabled: true,
                  },
                  pinch: {
                    enabled: true
                  },
                  mode: 'xy',
                },
                pan: {
                  enabled: true,

                }
              }
            }
          }
        }
      )

      // wait for loading of tracks to complete
      const allTracks = await allTracksPromise
      const tby = tracksByYear(allTracks)
      const pgDs = generateChartDataSets(tby)

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
