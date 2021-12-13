import { Map as OlMap, View } from 'ol' // rename needed not to conflict with javascript native Map()
import { transformExtent } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Control, defaults as defaultControls } from 'ol/control'
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
      controls: defaultControls().extend([
        new ZoomToTracksControl({
          actionCallBack: this.setExtentAndZoomOut.bind(this)
        })
      ]),
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

  setExtentAndZoomOut () {
    const visibleIds = this.getLayerIdsVisible()
    const extentList = []
    for (const id of visibleIds) {
      extentList.push(
        this.getTrackLayer(id).getSource().getExtent()
      )
    }
    const overallBbox = new ExtentCollection(extentList).boundingBox()
    if (overallBbox != null) {
      this.setMapView(overallBbox)
      this.zoomOut()
    }
  }
}

class ZoomToTracksControl extends Control {
  /**
   * @param {Object} [optOptions] Control options.
   */
  constructor (optOptions) {
    // options:
    //   actionsCallback
    const options = optOptions || {}

    const button = document.createElement('button')
    // const svg = document.createElement('svg')

    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/></svg>'

    const element = document.createElement('div')
    element.className = 'map-control-expand ol-unselectable ol-control'
    element.appendChild(button)

    super({
      element: element,
      target: options.target
    })

    button.addEventListener('click', optOptions.actionCallBack || function () {}, false)
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
    if (l.length === 0) return null
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
