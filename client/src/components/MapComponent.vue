<template>
  <div
    id="mapdiv"
    label="Map"
  />
</template>

<script>
// import { getGeoJson } from '@/lib/trackServices.js'
import { ManagedMap } from '@/lib/mapServices.js'

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
  data () {
    return {
    }
  },
  created () {
    // watch if the viewport is resized and resize the map
    this.initMap()
  },
  mounted () {
    this.$nextTick(() => {
      this.setTarget()
    })
  },
  methods: {
    initMap: function () {
      this.mmap = new ManagedMap()
      // this.drawTrack()

      // setMapViewAndDrawTrack(this.trackId, map, this.sid)
    },
    setExtentAndZoomOut: function () {
      this.mmap.setExtentAndZoomOut()
    },
    // drawTrack: async function () {
    //   const resultSet = await getGeoJson([this.trackId], this.sid)
    //   const result = resultSet[0]
    //   this.mmap.addTrackLayer(result)
    //   this.setExtentAndZoomOut()
    // },
    setTarget: function () {
      this.mmap.map.setTarget('mapdiv')
      this.mmap.zoomOut()
    }
  }
}

</script>

<style>
#mapdiv {
  width: 100%;
  height: 100%;
}
.map-control-expand {
  top: 4em;
  left: .5em;
}

  @import '../../node_modules/ol/ol.css'

</style>
