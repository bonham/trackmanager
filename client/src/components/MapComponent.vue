<template>
  <div id="mapdiv" label="Map" />
</template>

<script lang="ts">
import { getGeoJson } from '@/lib/trackServices'
import { ManagedMap } from '@/lib/mapServices'

export default {
  name: 'MapComponent',
  props: {
    trackId: {
      type: Number,
      required: true
    },
    sid: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      mmap: null as null | ManagedMap
    }
  },
  created: async function () {
    this.mmap = new ManagedMap()
    await this.drawTrack()
  },
  mounted() {
    this.$nextTick(() => {
      this.mmap!.map.setTarget('mapdiv')
    })
  },
  methods: {

    drawTrack: async function () {
      const resultSet = await getGeoJson([this.trackId], this.sid)
      const result = resultSet[0]
      this.mmap!.addTrackLayer(result)
      this.mmap!.setExtentAndZoomOut()
    }
  }
}

</script>

<style>
@import '../../node_modules/ol/ol.css';

#mapdiv {
  width: 100%;
  height: 100%;
}

.map-control-expand {
  top: 4em;
  left: .5em;
}
</style>
