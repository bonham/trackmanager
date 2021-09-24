<template>
  <div>
    <h1 class="mt-4 mb-4">
      Edit Tracks
    </h1>
    <b-table
      striped
      hover
      :items="niceItems"
      :fields="trackTableFields"
    >
      <template #cell(cbutton)="row">
        <b-button
          @click="cleanUpText(row)"
        >
          <b-icon-arrow-left />
        </b-button>
      </template>
    </b-table>
  </div>
</template>

<script>
import { BTable, BButton, BIconArrowLeft } from 'bootstrap-vue'
import { getAllTracks } from '@/lib/trackServices.js'

const trackTableFields = [
  {
    key: 'name',
    label: 'Name',
    sortable: 'true',
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
    sortable: 'true',
    tdClass: 'align-middle'

  },
  {
    key: 'time',
    label: 'Date',
    sortable: 'true',
    tdClass: 'align-middle'
  },
  {
    key: 'length',
    label: 'Length',
    sortable: 'true',
    tdClass: 'align-middle'

  }

]
export default {
  name: 'TrackMultiEdit',
  components: {
    BTable,
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
    cleanUpText: function (row) {
      const idx = row.index
      console.log(idx)
      row.item.name = 'ooo'
    }
  }

}
</script>
