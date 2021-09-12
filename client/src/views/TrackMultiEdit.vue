<template>
  <div>
    <h1 class="mt-4 mb-4">
      Edit Tracks
    </h1>
    <b-table
      striped
      hover
      :items="trackFlatList"
    />
  </div>
</template>

<script>
import { BTable } from 'bootstrap-vue'

export default {
  name: 'TrackMultiEdit',
  components: {
    BTable
  },
  data () {
    return {
      trackFlatList: []
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
