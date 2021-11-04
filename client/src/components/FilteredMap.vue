<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div
      id="mapdiv"
    />
  </div>
</template>
<script>
import { createMap, setMapView, drawTrack } from '@/lib/mapServices.js'
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
          this.map.updateSize()
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
      this.map = createMap()
      const resultSet = await getGeoJson([2, 3])

      resultSet.forEach(result => {
        const gj = result.geojson
        setMapView(gj.bbox, this.map)
        drawTrack(gj, this.map)
      })
    },
    setTarget: function () {
      this.map.setTarget('mapdiv')
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
