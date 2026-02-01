<template>
  <track-manager-nav-bar :sid="sid">
    <div class="mt-4 mb-4">
      <h1 style="display: inline-block;">
        Edit Tracks
      </h1>
      <b-spinner v-if="loading" />
    </div>

    <BTable id="tracktable" striped hover :items="tableItems" :fields="trackTableFields" primary-key="id">
      <!-- put following line into table lite tag for transitions in table -->
      <!-- :tbody-transition-props="transProps" -->

      <template #cell(name)="data">
        <div v-if="data.item.loading">
          <span class="cell-updating">Updating ..</span>
        </div>

        <div v-else>
          <editable-text :textarea="false" :text-prop="stringOrEmpty(data.value)"
            :update-function="(value: string) => processNameUpdate(data.item, value)" />
        </div>
      </template>

      <template #cell(cbutton)="row">
        <b-button aria-label="updateName" @click="nameFromSrc(row.item)">
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
import { getAllTracks, getTrackById, updateTrackById, deleteTrack, updateNameFromSource } from '@/lib/trackServices'
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
const tableItemsByTrackId: Record<number, TableItem> = {}
const tracksByTrackId = ref<Record<number, Track>>({})
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

    const item: TableItem = {}
    item.id = t.id
    item.name = t.name ?? ""
    item.src = t.src ?? ""
    item.length = (t.distance() / 1000).toFixed(0)
    item.time = t.localeDateShort()
    item.loading = false

    tableItems.value.push(item)
    tableItemsByTrackId[t.id] = item
  })
  loading.value = false
}
async function nameFromSrc(item: TableItem): Promise<boolean> {

  if (!isNumber(item.id)) throw Error("item.id not number")
  const id = item.id
  item.loading = true

  // update name from source in backend
  const updateSuccess = await updateNameFromSource(id, props.sid)
  let updatedName: string | null = null

  if (updateSuccess) {

    const updatedTrack = await getTrackById(id, props.sid)
    if (updatedTrack !== null) {
      updatedName = updatedTrack.name
      console.log(`Updated name ${updatedName}`)
    } else {
      console.error(`Could not read updated track with id ${id}`)
      return false
    }
  } else {
    console.error(`Updating name from source for track ${id} failed`)
    return false
  }

  const tableItem = tableItemsByTrackId[id]
  if (tableItem !== undefined) tableItem.name = updatedName

  // changing value of item.loading makes sure editable text is re-rendered and prop name is put into dom element ??
  item.loading = false
  return true
}
// function cleanAll() {
//   tableItems.value.forEach(item => {
//     cleanUpText(item).catch(console.error)
//   })
// }
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

async function processNameUpdate(item: TableItem, updatedValue: string): Promise<boolean> {
  if (!isNumber(item.id)) throw Error("item.id not number")
  console.log('in upper component:', item.id, updatedValue)
  try {
    const success = await updateTrackById(item.id, { name: updatedValue }, props.sid)
    if (success) {
      item.name = updatedValue
      return true
    } else {
      console.log(`Updating table item with track id was not successful:`, item.id)
      // item.name is still on previous value, but dom text needs to be synchronized:
      return false
    }
  } catch (error) {
    console.error(error)
    return false
  }
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
