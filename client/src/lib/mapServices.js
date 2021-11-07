import { Map, View } from 'ol'
import { transformExtent } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Stroke, Style } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
const _ = require('lodash')

class ManagedMap {
  constructor () {
    this.map = this._createMap()
  }

  _createMap (center = [0, 0], zoom = 0) {
    const map = new Map({
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: center,
        zoom: zoom
      })
    })
    return map
  }

  // set map view from bounding box
  setMapView (bbox) {
    const extent = transformExtent(
      bbox,
      'EPSG:4326',
      'EPSG:3857'
    )
    const mapSize = this.map.getSize()
    const view = this.map.getView()

    view.fit(
      extent,
      mapSize
    )
  }

  drawTrack (geoJson) {
    const vectorLayer = createLayer(geoJson)
    this.map.addLayer(vectorLayer)
  }

  zoomOut (scale = 0.97) {
    // zoom a bit out
    const view = this.map.getView()
    view.animate(
      { zoom: view.getZoom() * scale }
    )
  }
}

// create a layer from a geojson
function createLayer (geoJson) {
  // load track
  const style = new Style({
    stroke: new Stroke({
      color: 'brown',
      width: 2
    })
  })

  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(
      geoJson,
      {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      }
    )
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style
  })
  return vectorLayer
}

class GeoJsonCollection {
  constructor (geoJsonList) {
    this.geoJsonList = geoJsonList
  }

  // calculate maximum bounding box for all geojson objects
  boundingBox () {
    const l = this.geoJsonList
    const left = _.min(_.map(l, (x) => { return x.geojson.bbox[0] }))
    const bottom = _.min(_.map(l, (x) => { return x.geojson.bbox[1] }))
    const right = _.max(_.map(l, (x) => { return x.geojson.bbox[2] }))
    const top = _.max(_.map(l, (x) => { return x.geojson.bbox[3] }))
    return [left, bottom, right, top]
  }
}

export { ManagedMap, GeoJsonCollection }
