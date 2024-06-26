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
type TracksByYearDict = { [key: number]: Track[] };

function tracksByYear(loadedTracks: Track[]): TracksByYearDict {
  const trackFlatList = _.values(loadedTracks)
  return _.groupBy(trackFlatList, (x: Track) => x.year())
}

function progressDataSets(tracksByYear: TracksByYearDict) {

  interface DSet {
    label: string,
    data: { x: DateTime, y: number }[],
    pointRadius: number
  }

  const returnValue: DSet[] = []

  const yearList = _.keys(tracksByYear).map((ys) => Number.parseInt(ys))
  yearList.sort().reverse()

  const maxYear = Math.max(...yearList)
  for (const year of yearList) {

    if (tracksByYear[year] !== undefined) {

      const dateAndLength = tracksByYear[year].map((t) => {
        return { x: t.getTime(), delta: t.distance(), name: t.getNameOrSrc() }
      })

      const dateAndLengthClean = dateAndLength.filter((e) => {
        return (e.x !== null)
      }) as { x: DateTime<boolean>, delta: number, name: string }[]

      dateAndLengthClean.sort((a, b) => (a.x.toSeconds() - b.x.toSeconds()))

      let sum = 0
      const datesAndCumulatedLength = dateAndLengthClean.map(({ x, delta, name }) => {
        const step = delta / 1000
        sum += step
        const normDate = x.set({ year: 2024 })
        return { x: normDate, y: sum, step, name }
      })
      const dataset: DSet = {
        label: year.toString(),
        data: datesAndCumulatedLength,
        pointRadius: (year === maxYear) ? 5 : 3
      }
      returnValue.push(dataset)
    }
  }
  return returnValue
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

      const mychart: Chart<"line", { x: DateTime; y: number; }[], DateTime> = new Chart(
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
                  tooltipFormat: 'ccc MMM d',
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
                  callback: (value) => `${value} km`
                }
              }
            },
            plugins: {
              tooltip: {
                boxPadding: 10,
                callbacks: {
                  beforeLabel: function (context) {
                    return context.dataset.label
                  },
                  label: function (context) {
                    return Math.round((context.raw as ChartData).step) + " km"
                  },
                  afterLabel: function (context) {
                    return (context.raw as ChartData).name
                  }
                }
              },
              legend: {
                position: 'chartArea'
              }
            }
          }
        }
      )

      // wait for loading of tracks to complete
      const allTracks = await allTracksPromise
      const tby = tracksByYear(allTracks)
      const pgDs = progressDataSets(tby)

      // update chart data
      mychart.data.datasets = pgDs
      mychart.update()
      loading.value = false

    } else {
      console.log("Canvas null")
    }
  }).catch((err) => {
    console.error("Error in nextTick", err)
  })
})

</script>
