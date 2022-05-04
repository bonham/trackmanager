<template>
  <b-container
    id="root"
    class="d-flex flex-column vh-100"
  >
    <track-manager-nav-bar :sid="sid" />
    <h1 class="mt-4 mb-4">
      Edit Tracks
    </h1>
    <b-button
      class="mb-3"
      @click="cleanAll"
    >
      Clean all
    </b-button>
    <b-table-lite
      striped
      hover
      :items="niceItems"
      :fields="trackTableFields"
      primary-key="id"
    >
      <template #cell(name)="row">
        <span
          v-if="loadingStateById[row.item.id]"
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
    </b-table-lite>
  </b-container>
</template>

<script>
import { BTableLite, BButton, BIconArrowLeft, BSkeleton, BContainer } from 'bootstrap-vue'
import { getAllTracks, updateTrack } from '@/lib/trackServices.js'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'

const trackTableFields = [
  {
    key: 'id',
    label: 'Id',
    tdClass: 'align-middle'
  },
  {
    key: 'name',
    label: 'Name',
    tdClass: 'align-middle'
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
  }
]
export default {
  name: 'TrackMultiEdit',
  components: {
    BTableLite,
    BButton,
    BIconArrowLeft,
    BSkeleton,
    BContainer,
    TrackManagerNavBar
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
      loadingStateById: {},
      loadedTracks: [],
      tracksByTrackId: {}
    }
  },
  computed: {
    niceItems () {
      return this.loadedTracks.map(t => {
        const o = {}
        o.id = t.id
        o.name = t.name
        o.src = t.src
        o.length = (t.distance() / 1000).toFixed(0)
        o.time = t.localeDateShort()

        return o
      })
    }
  },
  created: async function () {
    // load data into store
    const sid = this.sid
    this.loadedTracks = await getAllTracks(sid)

    this.loadedTracks.forEach((t) => {
      // initialize loadingStateById
      this.loadingStateById[t.id] = false
      // sort by track id
      this.tracksByTrackId[t.id] = t
    })
  },
  methods: {
    cleanUpText: async function (item) {
      const id = item.id
      this.loadingStateById[id] = true
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
      const sid = this.sid
      const track = this.tracksByTrackId[id]
      const updateAttributes = ['name']
      await updateTrack(track, updateAttributes, sid)
      this.loadingStateById[id] = false
    },
    cleanAll: function () {
      this.niceItems.forEach(item => {
        this.cleanUpText(item)
      })
    }
  }

}
</script>
