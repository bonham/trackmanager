<template>
  <div>
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
  </div>
</template>

<script>
import { BTableLite, BButton, BIconArrowLeft, BSkeleton } from 'bootstrap-vue'
import { getAllTracks, updateTrack } from '@/lib/trackServices.js'
import { mapActions, mapGetters, mapState } from 'vuex'
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
const _ = require('lodash')

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
      loadingStateById: {}
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
    const sid = this.sid
    const loadFunc = () => getAllTracks(sid)
    await this.loadTracks(loadFunc).catch(e => console.error(e))
    const loadingStateById = _.reduce(
      this.niceItems,
      function (result, value) {
        const id = value.id
        result[id] = false
        return result
      },
      {}
    )
    this.loadingStateById = loadingStateById
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
      const updFunc = (track, attributes) => updateTrack(track, attributes, sid)
      this.modifyTrack({
        id: id,
        props: { name: convertedName },
        updateFunction: updFunc
      })
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
