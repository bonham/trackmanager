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

// helper functions
type TracksByYearDict = Record<number, Track[]>;

function tracksByYear(loadedTracks: Track[]): TracksByYearDict {
  const trackFlatList = _.values(loadedTracks)
  return _.groupBy(trackFlatList, (x: Track) => x.year())
}

/**
 * Converts yearly track data into Chart.js line datasets, calculating
 * cumulative distance for each year with dates normalized to 2024 for comparison.
 * @param tracksByYear Dictionary mapping years to arrays of Track objects
 * @returns Array of Chart.js datasets with cumulative distance data, larger point radius for the most recent year
 */
function generateChartDataSets(tracksByYear: TracksByYearDict) {

  interface ChartDataPoint {
    x: DateTime<true>,
    y: number,
    name: string,
    step: number,
    originalDate: DateTime<true>
  }

  interface DSet {
    label: string,
    data: ChartDataPoint[],
    pointRadius: number
  }

  const yearList = _.keys(tracksByYear).map((ys) => Number.parseInt(ys))
  yearList.sort().reverse()

  const maxYear = Math.max(...yearList)

  // Add one dataset per year, with cumulative distance and normalized dates for comparison
  const returnDataSetList: DSet[] = []
  for (const year of yearList) {

    if (tracksByYear[year] !== undefined) {

      // Clean and sort tracks for the year
      const sortedValidTracks: Track[] = []
      for (const track of tracksByYear[year]) {

        const tTime = track.getTime()

        if (tTime?.isValid) {
          sortedValidTracks.push(track)
        }
        sortedValidTracks.sort((a, b) => (a.getTime()!.toSeconds() - b.getTime()!.toSeconds()))
      }

      // map tracks to dataset structure with cumulative distance, normalizing dates to 2024 for comparison across years
      let sum = 0
      const chartData: ChartDataPoint[] = sortedValidTracks.map(
        (t: Track) => {
          const step = t.distance() / 1000
          sum += step

          const trackDate = t.getTime() as DateTime<true>
          const normDate = trackDate.set({ year: 2024 })
          return {
            x: normDate, y: sum, step, name: t.getNameOrSrc(), originalDate: trackDate
          }
        })

      // Label below is for whole dataset, not individual points
      const dataset: DSet = {
        label: year.toString(),
        data: chartData,
        pointRadius: (year === maxYear) ? 5 : 3
      }

      returnDataSetList.push(dataset)
    }
  }
  return returnDataSetList
}

// load tracks async
const allTracksPromise = getAllTracks(props.sid)

// generate empty chart
onMounted(() => {
  nextTick(async () => {

    // should be defined after mount
    if (canvasref.value !== null) {

      // create and paint chart with no data
      interface ChartData { x: number, y: number, step: number, name: string }

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
                  title: function (context) {
                    return context[0]?.dataset.label ?? '- missing dataset label -'
                  },
                  beforeLabel: function (context) {
                    return "beforelabel is a label" + context.dataset.label
                  },
                  label: function (context) {
                    return Math.round((context.raw as ChartData).step) + " km"
                  },
                  afterLabel: function (context) {
                    return (context.raw as ChartData).name
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
