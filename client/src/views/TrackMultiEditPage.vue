<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar :sid="sid" />
    <h1 class="mt-4 mb-4">
      <editable-text text="Edit Tracks" />
    </h1>
    <b-button
      class="mb-3"
      @click="cleanAll"
    >
      Clean all
    </b-button>
    <b-table
      id="tracktable"
      striped
      hover
      :items="tableItems"
      :fields="trackTableFields"
      primary-key="id"
      :tbody-transition-props="transProps"
    >
      <template #cell(name)="row">
        <span
          v-if="row.item.loading"
        >
          <b-skeleton />
        </span>
        <span v-else>
          {{ row.item.name }}
        </span>
      </template>
      <template #cell(cbutton)="row">
        <b-button
          @click="cleanUpText(row.item)"
        >
          <b-icon-arrow-left />
        </b-button>
      </template>
      <template #cell(dbutton)="row">
        <b-button
          @click="deleteTrackFromTable(row.item)"
        >
          <b-icon-trash />
        </b-button>
      </template>
    </b-table>
  </b-container>
</template>

<script>
import {
  BTable, BButton,
  BIconArrowLeft, BIconTrash,
  BSkeleton, BContainer

} from 'bootstrap-vue'
import { getAllTracks, updateTrack, deleteTrack } from '@/lib/trackServices.js'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import EditableText from '@/components/EditableText.vue'

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
    BIconArrowLeft,
    BIconTrash,
    BSkeleton,
    BContainer,
    TrackManagerNavBar,
    EditableText
  },
  props: {
    sid: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      trackTableFields: trackTableFields,
      tableItems: [],
      tracksByTrackId: {},
      transProps: {
        // Transition name
        name: 'flip-list'
      }
    }
  },
  created: async function () {
    // load data into store
    await this.loadTracks()
  },
  methods: {
    loadTracks: async function () {
      const tracks = await getAllTracks(this.sid)
      tracks.forEach((t) => {
        // sort by track id
        this.tracksByTrackId[t.id] = t

        const item = {}
        item.id = t.id
        item.name = t.name
        item.src = t.src
        item.length = (t.distance() / 1000).toFixed(0)
        item.time = t.localeDateShort()
        item.loading = false

        this.tableItems.push(item)
      })
    },
    cleanUpText: async function (item) {
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
    deleteTrackFromTable: async function (item) {
      const success = await deleteTrack(item.id, this.sid)
      if (success) {
        delete this.tracksByTrackId[item.id]
        // delete element
        const idx = this.tableItems.findIndex((e) => e.id === item.id)
        this.tableItems.splice(idx, 1)
      }
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

</style>
