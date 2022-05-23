import { Map as OlMap, View } from 'ol' // rename needed not to conflict with javascript native Map()
import { transformExtent } from 'ol/proj'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Control, defaults as defaultControls } from 'ol/control'
import Select from 'ol/interaction/Select'
import { Stroke, Style } from 'ol/style'
import { getUid } from 'ol/util'
import GeoJSON from 'ol/format/GeoJSON'
const _ = require('lodash')

/*
How to use:

  created: async function () {
    this.mmap = new ManagedMap()
    await this.drawTrack()
  },
  mounted () {
    this.$nextTick(() => {
      this.mmap.map.setTarget()
    })
  },
  methods: {

    drawTrack: async function () {
      const resultSet = await getGeoJson([this.trackId], this.sid)
      const result = resultSet[0]
      this.mmap.addTrackLayer(result)
      this.mmap.setExtentAndZoomOut()
    },
  }
}

 */
class ManagedMap {
  constructor (opts) {
    opts = opts || {}
    this.map = this._createMap()
    // should be defined outside map and passed to map
    this.standardStyle = this._createStandardStyle()
    this.trackIdToLayerMap = new Map() // ids are keys, values are layers
    this.featureIdMap = new Map()

    // setup for track select interaction
    this.select = new Select({ hitTolerance: 5 })
    this.map.addInteraction(this.select)
    const selectCallBackFn = opts.selectCallBackFn || (() => {})
    const selectHandler = this._createSelectHandler(selectCallBackFn)
    const boundSelectHandler = selectHandler.bind(this)
    this.select.on('select', boundSelectHandler)
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
        center,
        zoom
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

  _createSelectHandler (callBackFn) {
    return (e) => {
      const selectedFeatures = e.selected
      selectedFeatures.forEach((feature) => {
        const fid = getUid(feature)
        callBackFn(this.getTrackIdByFeatureId(fid))
      })
    }
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
    const trackId = geoJsonWithId.id

    if (this.trackIdToLayerMap.has(trackId)) {
      console.log(`An attempt was made to add layer with track id ${trackId}, but a track with this id already exists in map layers`)
      return
    }
    const { featureIdList, vectorLayer } = createLayer(geojson, this.standardStyle)
    const vectorLayerId = getUid(vectorLayer)
    this.map.addLayer(vectorLayer)
    // add to maps
    this.trackIdToLayerMap.set(trackId, vectorLayer)
    featureIdList.forEach((fid) => {
      this.featureIdMap.set(fid, { vectorLayerId, trackId })
    })
  }

  setSelectedTrack (trackId) {
    const selectedFeatures = this.select.getFeatures()
    selectedFeatures.clear()
    const layer = this.getTrackLayer(trackId)
    const features = layer.getSource().getFeatures()
    features.forEach((f) => {
      selectedFeatures.push(f)
    })
  }

  getTrackIdByFeatureId (featureId) {
    return this.featureIdMap.get(featureId).trackId
  }

  getLayerIdByFeatureId (featureId) {
    return this.featureIdMap.get(featureId).vectorLayerId
  }

  getTrackLayer (trackId) {
    return this.trackIdToLayerMap.get(trackId)
  }

  setVisible (trackId) {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    layer.setVisible(true)
  }

  setInvisible (trackId) {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    layer.setVisible(false)
  }

  getTrackIds () {
    return Array.from(this.trackIdToLayerMap.keys())
  }

  getTrackIdsVisible () {
    const allIds = this.getTrackIds()
    return _.filter(allIds, id => { return this.getTrackLayer(id).getVisible() })
  }

  getTrackIdsInVisible () {
    const allIds = this.getTrackIds()
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
    const visibleIds = this.getTrackIdsVisible()
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
      element,
      target: options.target
    })

    button.addEventListener('click', optOptions.actionCallBack || function () {}, false)
  }
}

// create a layer from a geojson
function createLayer (geoJson, style) {
  // load track

  const features = new GeoJSON().readFeatures(
    geoJson,
    {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857'
    }
  )
  const featureIdList = features.map((f) => getUid(f))

  const vectorSource = new VectorSource({
    features
  })

  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style
  })
  return { featureIdList, vectorLayer }
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
