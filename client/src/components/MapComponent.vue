<template>
  <div id="mapdiv" label="Map" />
  <div ref="popupdiv"></div>
</template>

<script lang="ts">
import { getGeoJson, getTrackById } from '@/lib/trackServices'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'

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
  created: function () {
    this.mmap = new ManagedMap()
    this.drawTrack() // async
  },
  mounted() {
    this.$nextTick(() => {
      if (!this.mmap) throw new Error("Managed map not initialized")
      this.mmap.map.setTarget('mapdiv')
      const popupDiv = this.$refs.popupdiv as HTMLElement
      this.mmap.initPopup(popupDiv)
      console.log("map mounted")
    })
  },
  methods: {

    drawTrack: async function () {
      const resultSet = await getGeoJson([this.trackId], this.sid)
      const result = resultSet[0]
      const track = await getTrackById(this.trackId, this.sid)
      if (track === null) {
        console.error(`Could not get track with id ${this.trackId}`)
      } else {
        this.mmap!.addTrackLayer({ geojson: result.geojson, track: track })
        this.mmap!.setExtentAndZoomOut()
      }
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

.popover-body {
  min-width: 276px;
}
</style>
