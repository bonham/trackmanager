<template>
  <div>
    <track-manager-nav-bar />
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
import { mapActions, mapGetters, mapState } from 'vuex'
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
    TrackManagerNavBar
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
    await this.loadTracks(getAllTracks).catch(e => console.error(e))
  },
  methods: {
    ...mapActions([
      'loadTracks',
      'modifyTrack'
    ]),
    ...mapGetters([
      'getTrackById'
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

      // Update track in store and on server
      this.modifyTrack({
        id: item.id,
        props: { name: convertedName },
        updateFunction: updateTrack
      })
    },
    cleanAll: function () {
      this.niceItems.forEach(item => {
        this.cleanUpText(item)
      })
    }
  }

}
</script>
