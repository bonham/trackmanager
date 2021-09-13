<template>
  <div>
    <h1 class="mt-4 mb-4">
      Edit Tracks
    </h1>
    <b-table
      striped
      hover
      :items="trackFlatList"
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
import { trackTableFields } from '@/lib/Track.js'

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
  created: function () {
    fetch('/api/tracks')
      .then(response => response.json())
      .then(data => {
        this.trackFlatList = data.sort((a, b) => { return (a.id - b.id) })
        return data
      }, err => console.log(err))
  }

}
</script>
