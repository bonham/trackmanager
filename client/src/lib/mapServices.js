import { Map as OlMap, View } from 'ol' // rename needed not to conflict with javascript native Map()
import { transformExtent } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Stroke, Style } from 'ol/style'
import GeoJSON from 'ol/format/GeoJSON'
const _ = require('lodash')

class ManagedMap {
  constructor () {
    this.map = this._createMap()
    // should be defined outside map and passed to map
    this.standardStyle = this._createStandardStyle()
    this.layerMap = new Map() // ids are keys, values are layers
  }

  _createMap (center = [0, 0], zoom = 0) {
    const map = new OlMap({
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

  _createStandardStyle () {
    return new Style({
      stroke: new Stroke({
        color: 'brown',
        width: 2
      })
    })
  }

  // set map view from bounding box in EPSG:4326
  setMapViewBbox (bbox) {
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

  // set map view from extent in map projection EPSG:3857
  setMapView (extent) {
    const mapSize = this.map.getSize()
    const view = this.map.getView()

    view.fit(
      extent,
      mapSize
    )
  }

  addTrackLayer (geoJsonWithId) { // geojsonwithid: { id: id, geojson: geojson }
    const geojson = geoJsonWithId.geojson
    const id = geoJsonWithId.id

    if (this.layerMap.has(id)) {
      console.log(`An attempt was made to add layer with ${id}, but a layer with this id already exists in map`)
      return
    }
    const vectorLayer = createLayer(geojson, this.standardStyle)
    this.map.addLayer(vectorLayer)
    // add to map
    this.layerMap.set(id, vectorLayer)
  }

  getTrackLayer (id) {
    return this.layerMap.get(id)
  }

  setVisible (id) {
    const layer = this.layerMap.get(id)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${id}`)
    layer.setVisible(true)
  }

  setInvisible (id) {
    const layer = this.layerMap.get(id)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${id}`)
    layer.setVisible(false)
  }

  getLayerIds () {
    return Array.from(this.layerMap.keys())
  }

  getLayerIdsVisible () {
    const allIds = this.getLayerIds()
    return _.filter(allIds, id => { return this.getTrackLayer(id).getVisible() })
  }

  getLayerIdsInVisible () {
    const allIds = this.getLayerIds()
    return _.reject(allIds, id => { return this.getTrackLayer(id).getVisible() })
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
function createLayer (geoJson, style) {
  // load track

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

class ExtentCollection {
  constructor (extentList) { // one extent is: [minx, miny, maxx, maxy]
    this.extentList = extentList
  }

  boundingBox () {
    const l = this.extentList
    const left = _.min(_.map(l, (x) => { return x[0] }))
    const bottom = _.min(_.map(l, (x) => { return x[1] }))
    const right = _.max(_.map(l, (x) => { return x[2] }))
    const top = _.max(_.map(l, (x) => { return x[3] }))
    return [left, bottom, right, top]
  }
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

export { ManagedMap, GeoJsonCollection, ExtentCollection }
