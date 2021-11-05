<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div
      id="mapdiv"
    />
  </div>
</template>
<script>
import { ManagedMap } from '@/lib/mapServices.js'
import { getGeoJson } from '@/lib/trackServices.js'
import { mapMutations } from 'vuex'

export default {
  name: 'FilteredMap',
  created () {
    // initialize map object
    this.initMap()

    // watch if the viewport is resized and resize the map
    this.$store.watch(
      (state) => {
        return this.$store.state.resizeMap
      },
      (newValue, oldValue) => {
        if (newValue === true) {
          this.mmap.map.updateSize()
          this.resizeMapClear()
        }
      }
    )
  },
  mounted () {
    this.$nextTick(() => {
      this.setTarget()
    })
  },
  methods: {
    initMap: async function () {
      const mmap = new ManagedMap()
      this.mmap = mmap
      const resultSet = await getGeoJson([2, 3])

      resultSet.forEach(result => {
        const gj = result.geojson
        mmap.setMapView(gj.bbox)
        mmap.drawTrack(gj)
      })
    },
    setTarget: function () {
      this.mmap.map.setTarget('mapdiv')
      this.mmap.zoomOut()
    },
    ...mapMutations([
      'resizeMapClear'
    ])
  }
}

</script>

<style>
#mapdiv {
  width: 100%;
  height: 100%;
}
  @import '../../node_modules/ol/ol.css'

</style>
