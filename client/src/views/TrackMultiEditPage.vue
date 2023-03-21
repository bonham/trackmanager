<template>
  <b-container id="root" class="d-flex flex-column vh-100">
    <track-manager-nav-bar :sid="sid" />
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

          <editable-text
:textarea="false" :initialtext="data.value"
            :update-function="(value: string) => processUpdate(data.item.id, value)" />
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
  </b-container>
</template>

<script lang="ts">
import {
  BTable, BButton,
  BContainer, BSpinner

} from 'bootstrap-vue-next'
import { getAllTracks, updateTrack, updateTrackById, deleteTrack } from '@/lib/trackServices'
import type { Track } from '@/lib/Track'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import EditableText from '@/components/EditableText.vue'

type TableItem = {
  id: number
  name: string
  src: string
  length: string
  time: string
  loading: boolean
}

const trackTableFields = [
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
]
export default {
  name: 'TrackMultiEdit',
  components: {
    BTable,
    BButton,
    BContainer,
    BSpinner,
    TrackManagerNavBar,
    EditableText
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      trackTableFields,
      tableItems: [] as TableItem[],
      tracksByTrackId: {} as { [index: number]: Track },
      transProps: {
        // Transition name
        name: 'flip-list'
      },
      loading: false
    }
  },
  created: async function () {
    // load data into store
    await this.loadTracks()
  },
  methods: {

    loadTracks: async function () {
      this.loading = true
      const tracks = await getAllTracks(this.sid)
      tracks.sort(
        (a, b) => {
          if (!a.time) return -1
          if (!b.time) return 1
          return a.time < b.time ? -1 : 1
        }
      )
      tracks.forEach((t) => {
        // sort by track id
        this.tracksByTrackId[t.id] = t

        const item = {} as TableItem
        item.id = t.id
        item.name = t.name
        item.src = t.src
        item.length = (t.distance() / 1000).toFixed(0)
        item.time = t.localeDateShort()
        item.loading = false

        this.tableItems.push(item)
      })
      this.loading = false
    },
    cleanUpText: async function (item: TableItem) {
      const id = item.id
      item.loading = true
      let convertedName = item.src
      const datePattern = /\d{8}/
      const match = convertedName.match(datePattern)
      if (match) {
        // const date = match[0]
        convertedName = convertedName.replace(datePattern, '')
      }
      convertedName = convertedName.replace(/[ \-_]+/g, ' ') // convert to space
      convertedName = convertedName.replace(/\.gpx$/i, '') // strip file suffix
      convertedName = convertedName.trim() // Trim space at begin or end

      // Update track in store and on server
      const track = this.tracksByTrackId[id]
      // Update property in track item
      track.name = convertedName

      // Perform update in backend
      const updateAttributes = ['name']
      await updateTrack(track, updateAttributes, this.sid)
      item.name = convertedName
      item.loading = false
    },
    cleanAll: function () {
      this.tableItems.forEach(item => {
        this.cleanUpText(item)
      })
    },
    deleteTrackFromTable: async function (item: TableItem) {
      const success = await deleteTrack(item.id, this.sid)
      if (success) {
        delete this.tracksByTrackId[item.id]
        // delete element
        const idx = this.tableItems.findIndex((e) => e.id === item.id)
        this.tableItems.splice(idx, 1)
      }
    },
    processUpdate(trackId: number, value: string) {
      console.log('in upper component:', trackId, value)
      updateTrackById(trackId, { name: value }, this.sid)
    }
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
