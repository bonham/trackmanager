<template>
  <track-manager-nav-bar :sid="sid">
    <div class="px-2">
      <div>
        <div>
          <span v-if="loading">Loading <b-spinner small />
          </span>
        </div>
        <div class="d-flex flex-column flex-grow-1">
          <canvas id="acquisitions" ref="canvasref"></canvas>
        </div>
      </div>
    </div>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import Chart from 'chart.js/auto';
import 'chartjs-adapter-luxon';
import _ from 'lodash'

import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { Track, TrackCollection } from '@/lib/Track'
import { getAllTracks } from '@/lib/trackServices'
import { BSpinner } from 'bootstrap-vue-next'
import { ref, computed, onMounted, nextTick } from 'vue'
import type { Ref } from 'vue'
import { DateTime } from 'luxon';

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})


const mydataSets = [{
  label: "Empty",
  data: []
}]
let mychart: Chart<"line", { x: DateTime; y: number; }[], DateTime>


const loadedTracks: Ref<Track[]> = ref([])
const loading = ref(true)
const canvasref = ref<(null | HTMLCanvasElement)>(null)

const tracksByYear = computed(() => {
  const trackFlatList = _.values(loadedTracks.value)
  return _.groupBy(trackFlatList, (x: Track) => x.year())

})

const yearList = computed(() => {
  const yl = _.keys(tracksByYear.value)
  yl.sort().reverse()
  return yl
})

const progressDataSets = computed(() => {

  interface DSet {
    label: string,
    data: { x: DateTime, y: number }[]
  }

  const returnValue: DSet[] = []

  for (const year of yearList.value) {

    if (tracksByYear.value[year] !== undefined) {

      const dateAndLength = tracksByYear.value[year].map((t) => {
        return { x: t.getTime(), y: t.distance(), name: t.getNameOrSrc() }
      })

      const dateAndLengthClean = dateAndLength.filter((e) => {
        return (e.x !== null)
      }) as { x: DateTime<boolean>, y: number, name: string }[]

      dateAndLengthClean.sort((a, b) => (a.x.toSeconds() - b.x.toSeconds()))

      let sum = 0
      const datesAndCumulatedLength = dateAndLengthClean.map(({ x, y, name }) => {
        sum += y / 1000
        const normDate = x.set({ year: 2024 })
        return { x: normDate, y: sum, name }
      })
      const dataset: DSet = {
        label: year,
        data: datesAndCumulatedLength
      }
      returnValue.push(dataset)
    }
  }
  return returnValue
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const trackCollections = computed(() => {
  const r: { year: string, collection: TrackCollection }[] = []
  yearList.value.forEach(y => {
    const tc = new TrackCollection(tracksByYear.value[y])
    r.push({
      year: y,
      collection: tc
    })
  })
  return r

})


async function runOnCreate() {
  loadedTracks.value = await getAllTracks(props.sid)
  loading.value = false

  if (mychart !== undefined) {

    const newdata = progressDataSets.value
    console.log(newdata)

    mychart.data.datasets = newdata
    mychart.update()
    console.log("data changed")
  } else {
    console.log('mychart is not defined')
  }

  // const dataset = somethingWithDate.value.map(e => { return { x: e.x, y: e.y } })


  // if (chart) {
  //   chart.data.datasets = [
  //     { x: DateTime.now(), y: 7 }
  //   ]
  // }

}

onMounted(() => {
  nextTick(() => {
    console.log("In onMounted")

    if (canvasref.value !== null) {
      console.log("Canvas", canvasref.value)

      mychart = new Chart(
        canvasref.value,
        {
          type: 'line',
          data: {
            datasets: mydataSets,
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
                max: '2024-12-31 23:59',
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
                callbacks: {
                  label: function (context) {
                    return context.dataset.label + " " + Math.round(context.parsed.y) + " m"
                  },
                  afterLabel: function (context) {
                    return (context.raw as { x: number, y: number, name: string }).name
                  }
                }
              }
            }
          }
        }
      )
    } else {
      console.log("Canvas null")
    }
  }).catch((err) => {
    console.error("Error in nextTick", err)
  })
})

runOnCreate().catch((error) => console.log(error))

</script>
