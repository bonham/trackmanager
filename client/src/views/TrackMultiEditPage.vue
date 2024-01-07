<template>
  <track-manager-nav-bar :sid="sid">
    <div class="mt-4 mb-4">
      <h1 style="display: inline-block;">
        Edit Tracks
      </h1>
      <b-spinner v-if="loading" />
    </div>

    <b-button class="mb-3" @click="cleanAll">
      Clean all
    </b-button>
    <BTable id="tracktable" striped hover :items="tableItems" :fields="trackTableFields" primary-key="id">
      <!-- put following line into table lite tag for transitions in table -->
      <!-- :tbody-transition-props="transProps" -->

      <template #cell(name)="data">
        <div v-if="data.item.loading">
          <span class="cell-updating">Updating ..</span>
        </div>
        <div v-else>

          <editable-text :textarea="false" :initialtext="stringOrEmpty(data.value)"
            :update-function="(value: string) => processUpdate(numberOrNegative1(data.item.id), value)" />
        </div>
      </template>
      <template #cell(cbutton)="row">
        <b-button @click="cleanUpText(row.item)">
          <i-bi-arrow-left />
        </b-button>
      </template>
      <template #cell(dbutton)="row">
        <b-button aria-label="delete" @click="deleteTrackFromTable(row.item)">
          <i-bi-trash />
        </b-button>
      </template>
    </BTable>
  </track-manager-nav-bar>
</template>

<script setup lang="ts">
import {
  BTable, BButton,
  BSpinner
} from 'bootstrap-vue-next'
import type { TableItem } from 'bootstrap-vue-next'
import { getAllTracks, updateTrack, updateTrackById, deleteTrack } from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import EditableText from '@/components/EditableText.vue'
import { ref } from 'vue'

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function stringOrEmpty(u: unknown) {
  return isString(u) ? u : ''
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

function numberOrNegative1(u: unknown) {
  return isNumber(u) ? u : -1
}

const trackTableFields = ref([
  {
    key: 'id',
    label: 'Id',
    tdClass: 'align-middle',
    sortable: true
  },
  {
    key: 'name',
    label: 'Name',
    tdClass: 'align-middle',
    sortable: true
  },
  {
    key: 'cbutton',
    label: 'Clean',
    tdClass: 'align-middle'
  },
  {
    key: 'src',
    label: 'File Name',
    tdClass: 'align-middle'

  },
  {
    key: 'time',
    label: 'Date',
    tdClass: 'align-middle'
  },
  {
    key: 'length',
    label: 'Length',
    tdClass: 'align-middle'
  },
  {
    key: 'dbutton',
    label: 'Delete',
    tdClass: 'align-middle'
  }
])

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const tableItems = ref<TableItem[]>([])
const tracksByTrackId = ref<{ [index: number]: Track }>({})
const loading = ref(false)


loadTracks().catch((e) => { console.error(e) })


async function loadTracks() {
  loading.value = true
  const tracks = await getAllTracks(props.sid)
  tracks.sort(
    (a, b) => {
      // undefined pease 
      if (!a.time) return 1
      if (!b.time) return -1
      return b.secondsSinceEpoch() - a.secondsSinceEpoch()
    }
  )
  tracks.forEach((t) => {
    // sort by track id
    tracksByTrackId.value[t.id] = t

    const item = {} as TableItem
    item.id = t.id
    item.name = t.name || ""
    item.src = t.src || ""
    item.length = (t.distance() / 1000).toFixed(0)
    item.time = t.localeDateShort()
    item.loading = false

    tableItems.value.push(item)
  })
  loading.value = false
}
async function cleanUpText(item: TableItem) {
  if (!isNumber(item.id)) throw Error("item.id not number")
  const id = item.id
  item.loading = true
  let convertedName = stringOrEmpty(item.src)
  const datePattern = /\d{8}/
  const match = convertedName.match(datePattern)
  if (match) {
    // const date = match[0]
    convertedName = convertedName.replace(datePattern, '')
  }
  convertedName = convertedName.replace(/[ \-_]+/g, ' ') // convert to space
  convertedName = convertedName.replace(/\.gpx$/i, '') // strip file suffix
  convertedName = convertedName.trim() // Trim space at begin or end

  const track = tracksByTrackId.value[id]
  // Update property in track item
  track.name = convertedName

  // Perform update in backend
  const updateAttributes = ['name']
  await updateTrack(track, updateAttributes, props.sid)
  item.name = convertedName
  item.loading = false
}
function cleanAll() {
  tableItems.value.forEach(item => {
    cleanUpText(item).catch(console.error)
  })
}
async function deleteTrackFromTable(item: TableItem) {
  if (!isNumber(item.id)) throw Error("item.id not number")
  const success = await deleteTrack(item.id, props.sid)
  if (success) {
    delete tracksByTrackId.value[item.id]
    // delete element
    const idx = tableItems.value.findIndex((e) => e.id === item.id)
    tableItems.value.splice(idx, 1)
  }
}

function processUpdate(trackId: number, value: string) {
  console.log('in upper component:', trackId, value)
  updateTrackById(trackId, { name: value }, props.sid).catch(console.error)
}



</script>
<style>
.flip-list-move {
  transition: all 1s;
}

.flip-list-leave-active {
  display: none;
}

.flip-list-leave-to {
  opacity: 0;
}

.cell-updating {
  opacity: 0.5;
  font-style: italic;
}
</style>
