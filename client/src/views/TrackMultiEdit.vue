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
import { getAllTracks, updateTrack } from '@/lib/trackServices.js'
import { mapActions, mapState } from 'vuex'

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
      trackTableFields: trackTableFields
    }
  },
  computed: { // TODO: computed makes not much sense here
    ...mapState([
      'loadedTracks',
      'trackLoadStatus'
    ]),
    trackFlatList () {
      const keys = Object.keys(this.loadedTracks).sort()
      const r = []
      keys.forEach(key => {
        r.push(this.loadedTracks[key])
      })
      return r
    },
    niceItems () {
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
    // load data into store
    await this.loadTracks(getAllTracks)
  },
  methods: {
    ...mapActions([
      'loadTracks'
    ]),
    cleanUpText: async function (item) {
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

      // Update track on server
      const thisTrack = this.loadedTracks[item.id]
      thisTrack.name = convertedName

      try {
        const success = await updateTrack(thisTrack, ['name'])
        if (success) {
          // display on page
          item.name = convertedName
        } else {
          console.error(`Could not update track ${item.id}`)
        }
      } catch (err) {
        console.error(err)
      }
    },
    cleanAll: function () {
      this.trackFlatList.forEach(item => {
        this.cleanUpText(item)
      })
    }
  }

}
</script>
