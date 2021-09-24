<template>
  <div>
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
      <template #cell(cbutton)="row">
        <b-button
          @click="cleanUpText(row.item)"
        >
          <b-icon-arrow-left />
        </b-button>
      </template>
    </b-table-lite>
  </div>
</template>

<script>
import { BTableLite, BButton, BIconArrowLeft } from 'bootstrap-vue'
import { getAllTracks } from '@/lib/trackServices.js'

const trackTableFields = [
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
    BIconArrowLeft
  },
  data () {
    return {
      trackFlatList: [],
      trackTableFields: trackTableFields
    }
  },
  computed: {
    niceItems: function () {
      return this.trackFlatList.map(t => {
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
    this.trackFlatList = await getAllTracks()
  },
  methods: {
    cleanUpText: function (item) {
      let converted = item.src
      const datePattern = /\d{8}/
      const match = converted.match(datePattern)
      if (match) {
        // const date = match[0]
        converted = converted.replace(datePattern, '')
      }
      converted = converted.replace(/[ \-_]+/g, ' ') // convert to space
      converted = converted.replace(/\.gpx$/i, '') // strip file suffix
      converted = converted.trim() // Trim space at begin or end
      item.name = converted
    },
    cleanAll: function () {
      this.trackFlatList.forEach(item => {
        this.cleanUpText(item)
      })
    }
  }

}
</script>
