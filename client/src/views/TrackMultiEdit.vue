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
      <template #cell(name)="data">
        <b-form-input
          type="text"
          :value="data.value"
        />
      </template>
    </b-table>
  </div>
</template>

<script>
import { BTable, BFormInput } from 'bootstrap-vue'
import { getAllTracks } from '@/lib/trackServices.js'

const trackTableFields = [
  {
    key: 'name',
    label: 'Name',
    sortable: 'true'
  },
  {
    key: 'src',
    label: 'File Name',
    sortable: 'true'
  },
  {
    key: 'time',
    label: 'Date',
    sortable: 'true'
  },
  {
    key: 'length',
    label: 'Length',
    sortable: 'true'
  }

]
export default {
  name: 'TrackMultiEdit',
  components: {
    BTable,
    BFormInput
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
  }

}
</script>
