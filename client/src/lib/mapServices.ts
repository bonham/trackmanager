import { Feature, Map as OlMap, View } from 'ol' // rename needed not to conflict with javascript native Map()
import { transformExtent } from 'ol/proj'
import type { Extent } from 'ol/extent'
import { Layer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Control, defaults as defaultControls } from 'ol/control'
import type { Options as ZoomOptions } from 'ol/control/Zoom'
import Collection from 'ol/Collection'
import Select from 'ol/interaction/Select'
import { getUid } from 'ol/util'
import GeoJSON from 'ol/format/GeoJSON'
import type { Geometry } from 'ol/geom'
import { SelectEvent } from 'ol/interaction/Select'
import type BaseEvent from 'ol/events/Event'
import type { GeoJsonObject } from 'geojson'
import _ from 'lodash'
import { StyleFactory } from './mapStyles'
import type { StyleLike } from 'ol/style/Style'

type SelectionObject = { selected: number[], deselected: number[] }
type SelectCallbackFn = (x: SelectionObject) => void
type GeoJSONWithTrackId = { id: number, geojson: GeoJsonObject }
type FeatureIdMapMember = { vectorLayerId: string, trackId: number }


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

  map: OlMap
  styleFactory: StyleFactory
  trackIdToLayerMap: Map<number, Layer>
  featureIdMap: Map<string, FeatureIdMapMember>
  selectCollection: Collection<Feature<Geometry>>
  select: Select


  constructor(opts?: { selectCallBackFn: SelectCallbackFn }) {

    this.map = this._createMap()
    // should be defined outside map and passed to map
    this.styleFactory = new StyleFactory()
    this.trackIdToLayerMap = new Map() // ids are keys, values are layers
    this.featureIdMap = new Map()

    // setup for track select interaction
    //
    // Two ways how to select tracks:
    // Option A: push something to selectCollection. See setSelectedTrack(id)
    // Option B: interactive klick on track in map

    this.selectCollection = new Collection()
    this.select = new Select({
      hitTolerance: 5,
      features: this.selectCollection // For Option A
    })
    this.map.addInteraction(this.select) // For Option B

    // A callback function can be provided to trigger actions outside this object when user
    // is using select through klick on map ( Option B )
    const selectCallBackFn = opts ? opts.selectCallBackFn : (() => { })
    const selectHandler = this._createSelectHandler(selectCallBackFn)
    const boundSelectHandler = selectHandler.bind(this)

    this.select.on(['select'], boundSelectHandler)
    this.select.on(['select'], (this.manageZIndexOnSelect).bind(this))
  }

  ZINDEX_DEFAULT = 0
  ZINDEX_SELECTED = 5

  _createMap(center = [0, 0], zoom = 0) {
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

  _createSelectHandler(callBackFn: SelectCallbackFn) {
    const fn = (e: BaseEvent | Event) => {

      if (!(e instanceof SelectEvent)) {
        console.error("Expected SelectEvent, but dit not get it")
        return
      }

      const trackIdSelectObject: SelectionObject = { selected: [], deselected: [] }

      e.selected.forEach((feature: Feature<Geometry>) => {
        const tid = this.getTrackIdByFeature(feature)
        if (tid === undefined) { console.error("Got Track id which is undefined") }
        else { trackIdSelectObject.selected.push(tid) }
      })
      e.deselected.forEach((feature: Feature<Geometry>) => {
        const tid = this.getTrackIdByFeature(feature)
        if (tid === undefined) { console.error("Got Track id which is undefined") }
        else { trackIdSelectObject.deselected.push(tid) }
      })
      callBackFn(trackIdSelectObject)
    }
    return fn
  }

  // set map view from bounding box in EPSG:4326
  setMapViewBbox(bbox: Extent) {
    const extent = transformExtent(
      bbox,
      'EPSG:4326',
      'EPSG:3857'
    )

    this.setMapView(extent)
  }

  // set map view from extent in map projection EPSG:3857
  setMapView(extent: Extent) {
    const mapSize = this.map.getSize()
    if (mapSize === undefined) { console.error("Map size is undefined"); return }
    const view = this.map.getView()

    view.fit(
      extent,
      { size: mapSize }
    )
  }

  addTrackLayer(geoJsonWithId: GeoJSONWithTrackId) { // geojsonwithid: { id: id, geojson: geojson }
    const geojson = geoJsonWithId.geojson
    const trackId = geoJsonWithId.id

    if (this.trackIdToLayerMap.has(trackId)) {
      console.log(`An attempt was made to add layer with track id ${trackId}, but a track with this id already exists in map layers`)
      return
    }
    const style = this.styleFactory.getNext()
    const { featureIdList, vectorLayer } = createLayer(geojson, style)
    const vectorLayerId = getUid(vectorLayer)
    this.map.addLayer(vectorLayer)
    // add to maps
    this.trackIdToLayerMap.set(trackId, vectorLayer)
    featureIdList.forEach((fid) => {
      this.featureIdMap.set(fid, { vectorLayerId, trackId })
    })
  }

  setSelectedTracks(obj: SelectionObject) {
    const selected = obj.selected
    // const deselected = obj.deselected

    console.log('Warning: can only select first track of list')

    // reset current selection
    const selectCollection = this.selectCollection
    selectCollection.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_DEFAULT)
    })
    selectCollection.clear()

    // do nothing
    if (selected.length === 0) return

    const trackId = selected[0]
    const layer = this.getTrackLayer(trackId)
    if (layer === undefined) { console.error("Could not get layer"); return }

    const source = layer.getSource()
    if (!(source instanceof VectorSource)) { console.error("source is not of right type"); return }

    const features = source.getFeatures()
    if (features.length < 1) {
      console.error('No feature in layer', layer)
    } else if (features.length > 1) {
      console.log(`Not exactly 1 feature in layer, but: ${features.length}`)
    } else {
      this.setZIndex(features[0], this.ZINDEX_SELECTED)
      selectCollection.push(features[0])
    }
  }

  getSelectedTrackIds() {
    const trackIds = [] as number[]
    this.selectCollection.forEach((feature) => {
      const fid = getUid(feature)
      const trackId = this.getTrackIdByFeatureId(fid)
      if (trackId) { trackIds.push(trackId) }
      else { console.error("Track id is undefined") }
    })
    return trackIds
  }

  manageZIndexOnSelect(e: BaseEvent | Event) {

    if (!(e instanceof SelectEvent)) {
      console.error("Expected SelectEvent, but dit not get it")
      return
    }
    const selectEvent = e
    selectEvent.selected.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_SELECTED)
    })
    selectEvent.deselected.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_DEFAULT)
    })
  }

  setZIndex(feature: Feature, index: number) {
    const fid = getUid(feature)
    const trackId = this.getTrackIdByFeatureId(fid)
    if (trackId === undefined) { console.error("Trackid is undefined"); return }
    const layer = this.getTrackLayer(trackId)
    if (layer === undefined) { console.error("Track id is undefined"); return }
    layer.setZIndex(index)
  }

  getTrackIdByFeature(feature: Feature) {
    const featureId = getUid(feature)
    return this.getTrackIdByFeatureId(featureId)
  }

  getFeatureWithIdByFeatureId(featureId: string) {
    const featureWithId = this.featureIdMap.get(featureId)
    return featureWithId || undefined
  }

  getTrackIdByFeatureId(featureId: string) {
    const featureWithId = this.getFeatureWithIdByFeatureId(featureId)
    return featureWithId ? featureWithId.trackId : undefined
  }

  getLayerIdByFeatureId(featureId: string) {
    const featureWithId = this.getFeatureWithIdByFeatureId(featureId)
    return featureWithId ? featureWithId.vectorLayerId : undefined
  }

  getTrackLayer(trackId: number) {
    const tl = this.trackIdToLayerMap.get(trackId)
    if (tl === undefined) throw new Error(`Could not get track layer for id ${trackId}`)
    return tl
  }

  setVisible(trackId: number) {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    layer.setVisible(true)
  }

  setInvisible(trackId: number) {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    layer.setVisible(false)
  }

  getTrackIds() {
    return Array.from(this.trackIdToLayerMap.keys())
  }

  getTrackIdsVisible() {
    const allIds = this.getTrackIds()
    return _.filter(
      allIds,
      id => {
        const layer = this.getTrackLayer(id)
        return layer.getVisible()
      })
  }

  getTrackIdsInVisible() {
    const allIds = this.getTrackIds()
    return _.reject(
      allIds,
      id => {
        const layer = this.getTrackLayer(id)
        return layer ? layer.getVisible() : undefined
      })
  }

  zoomOut(scale = 0.97) {
    // zoom a bit out
    const view = this.map.getView()
    const zoomval = view.getZoom()
    if (zoomval === undefined) { console.error("Can not zoom"); return }
    view.animate(
      { zoom: zoomval * scale }
    )
  }

  setExtentAndZoomOut() {
    let zoomTrackids: number[]
    // if there is a selection zoom on selected tracks
    if (this.selectCollection.getLength() > 0) {
      zoomTrackids = this.getSelectedTrackIds()
      // else zoom on whole visible ids
    } else {
      zoomTrackids = this.getTrackIdsVisible()
    }
    const extentList = []
    for (const id of zoomTrackids) {
      const lid = this.getTrackLayer(id)
      if (lid === undefined) { console.error("Can not get track layer"); return }
      const source = lid.getSource()
      if (!(source instanceof VectorSource)) { console.error("source is not of right type"); return }
      extentList.push(
        source.getExtent()
      )
    }
    const overallBbox = new ExtentCollection(extentList).boundingBox()
    if (overallBbox) {
      this.setMapView(overallBbox)
      this.zoomOut()
    }
  }
}

interface ZoomToTracksControlOptions extends ZoomOptions {
  actionCallBack: (() => void)
}
class ZoomToTracksControl extends Control {
  /**
   * @param {Object} [optOptions] Control options.
   */
  constructor(optOptions: ZoomToTracksControlOptions) {
    // options:
    //   actionsCallback
    const options = optOptions

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

    button.addEventListener('click', optOptions.actionCallBack, false)
  }
}

// create a layer from a geojson
function createLayer(geoJson: GeoJsonObject, style: StyleLike) {
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
  extentList: Extent[]
  constructor(extentList: Extent[]) { // one extent is: [minx, miny, maxx, maxy]
    if (extentList.length === 0) throw new Error("Extentlist must have one element")
    this.extentList = extentList
  }

  boundingBox() {
    const l = this.extentList

    const left = _.min(_.map(l, (x) => { return x[0] })) as number
    const bottom = _.min(_.map(l, (x) => { return x[1] })) as number
    const right = _.max(_.map(l, (x) => { return x[2] })) as number
    const top = _.max(_.map(l, (x) => { return x[3] })) as number
    return [left, bottom, right, top]
  }
}
type GeoJSONObjectWithId = { geojson: GeoJsonObject, id: number }
class GeoJsonCollection {
  geoJsonList: GeoJSONObjectWithId[]
  constructor(geoJsonList: GeoJSONObjectWithId[]) {
    this.geoJsonList = geoJsonList
  }

  // calculate maximum bounding box for all geojson objects
  boundingBox() {
    const l = this.geoJsonList

    function pickBbox(go: GeoJSONObjectWithId) {
      const bbox = go.geojson.bbox
      if (bbox == undefined) { throw new Error("geojson does not have bbox") }
      return bbox
    }

    const left = _.min(_.map(l, (x) => { return pickBbox(x)[0] }))
    const bottom = _.min(_.map(l, (x) => { return pickBbox(x)[1] }))
    const right = _.max(_.map(l, (x) => { return pickBbox(x)[2] }))
    const top = _.max(_.map(l, (x) => { return pickBbox(x)[3] }))
    return [left, bottom, right, top]
  }
}

export { ManagedMap, GeoJsonCollection, ExtentCollection }
