<template>
  <div class="flex-grow-1 d-flex flex-column">
    <div
      id="mapdiv"
    />
  </div>
</template>
<script>
import { createMap, setMapViewAndDrawTrack } from '@/lib/mapServices.js'
import { getGeoJson } from '@/lib/trackServices.js'
import { mapMutations } from 'vuex'

export default {
  name: 'FilteredMap',
  created () {
    // watch if the viewport is resized and resize the map
    this.initMap()
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
      const resultSet = await getGeoJson([2])
      const gj = resultSet[0].geojson
      setMapViewAndDrawTrack(gj, this.map)
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
