import { ExtentCollection } from '@/lib/mapservices/ExtentCollection'
import { PopoverManager } from '@/lib/mapservices/PopoverManager'
import { createLayerFromGeoJson } from '@/lib/mapservices/createLayerFromGeoJson'
import { ZoomToTracksControl } from './ZoomToTracksControl'

import { Feature, Map as OlMap, View } from 'ol' // rename needed not to conflict with javascript native Map()
import { transformExtent } from 'ol/proj'
import type { Extent } from 'ol/extent'
import { Tile as TileLayer } from 'ol/layer'
import VectorLayer from 'ol/layer/Vector.js';
import { OSM, Vector as VectorSource } from 'ol/source'
import { defaults as defaultControls } from 'ol/control'
import Collection from 'ol/Collection'
import Select from 'ol/interaction/Select'
import { getUid } from 'ol/util'
import type { Geometry } from 'ol/geom'
import { SelectEvent } from 'ol/interaction/Select'
import type BaseEvent from 'ol/events/Event'
import type { GeoJsonObject } from 'geojson'
import _ from 'lodash'
import { StyleFactoryFixedColors } from '../mapStyles'
import type { StyleFactoryLike } from '../mapStyles'
import type { Track } from '@/lib/Track'
import type { Coordinate } from 'ol/coordinate'




interface SelectionObject { selected: number[], deselected: number[] }
export interface GeoJSONWithTrackId { id: number, geojson: GeoJsonObject }
export interface GeoJsonWithTrack { track: Track, geojson: GeoJsonObject }
interface FeatureIdMapMember { vectorLayerId: string, trackId: number }


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
export class ManagedMap {

  map: OlMap
  styleFactory: StyleFactoryLike
  trackIdToLayerMap: Map<number, VectorLayer<VectorSource<Feature<Geometry>>>> // ids are keys, values are layers>
  trackMap: Map<number, Track>
  featureIdMap: Map<string, FeatureIdMapMember>
  selectCollection: Collection<Feature<Geometry>>
  select: Select
  popovermgr = null as (null | PopoverManager)


  constructor() {

    this.map = this._createMap()
    // should be defined outside map and passed to map
    this.styleFactory = new StyleFactoryFixedColors()
    this.trackIdToLayerMap = new Map() // ids are keys, values are layers
    this.featureIdMap = new Map()
    this.trackMap = new Map()

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

    this.select.on(['select'], (this.processSelectEvent).bind(this))
    this.select.on(['select'], (this.manageZIndexOnSelect).bind(this))

  }

  initPopup(popupElement: HTMLElement) {
    this.popovermgr = new PopoverManager(popupElement)
    this.map.addOverlay(this.popovermgr.getOverlay())
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


  /**
   * Function which can process 'SelectEvent' from openlayers. 
   * 
   * 
   * During processing the following will happen
   * - A SelectionObject will be composed, translating the 'openlayers'
   *   Feature id for selected/deselected features
   *   into track ids
   * 
   * - A popover will be created for 'selected' objects ( using the SelectionObject )
   * 
   * 
   * @param callBackFn 
   * @returns void
   */
  processSelectEvent(event: BaseEvent | Event) {

    if (!(event instanceof SelectEvent)) {
      console.error("Expected SelectEvent, but dit get different type")
      return
    }

    const trackIdSelectObject = this.event2selectionObject(event)
    const numselected = trackIdSelectObject.selected.length

    if (numselected === 0) {
      this.disposePopover()
      return
    }

    if (numselected === 1) {

      const trackId = trackIdSelectObject.selected[0]
      if (trackId === undefined) {
        throw Error("Track id is undefined")
      }
      const coord = event.mapBrowserEvent.coordinate
      this.showPopover(trackId, coord)
      return
    }

    throw Error("Can not select multiple tracks at the moment")
  }

  event2selectionObject(sEvent: SelectEvent): SelectionObject {

    // Prepare SelectionObject
    const trackIdSelectObject: SelectionObject = { selected: [], deselected: [] }

    sEvent.selected.forEach((feature: Feature<Geometry>) => {
      const tid = this.getTrackIdByFeature(feature)
      if (tid === undefined) { console.error("Got Track id which is undefined") }
      else { trackIdSelectObject.selected.push(tid) }
    })
    sEvent.deselected.forEach((feature: Feature<Geometry>) => {
      const tid = this.getTrackIdByFeature(feature)
      if (tid === undefined) { console.error("Got Track id which is undefined") }
      else { trackIdSelectObject.deselected.push(tid) }
    })
    return trackIdSelectObject
  }

  disposePopover() {
    if (!this.popovermgr) {
      console.error("Not able to show popup. No popupmanager")
      return
    } else {
      this.popovermgr.dispose()
    }
  }

  showPopover(trackId: number, coord: Coordinate) {
    // Manage popup: show on select
    if (this.popovermgr) {

      const track = this.trackMap.get(trackId)

      if (!track) {
        console.error("Could not find track with id %i", trackId)
        return
      }
      const dateopts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: '2-digit', year: '2-digit' }
      const title = `${track.localeDateShort(dateopts)}`
      let content = `${track.getNameOrSrc()}<br>Dist: ${(track.distance() / 1000).toFixed()} km`
      content += track.getAscent() ? `<br>Ascent: ${track.getAscent().toFixed()} m` : ""

      this.popovermgr.setNewPopover(coord, {
        animation: false,
        content,
        placement: 'top',
        title
      })
    }
  }


  // set map view from bounding box in EPSG:4326 (GPS Lat Lon system https://epsg.io/4326 ) ( aka WGS84  )
  setMapViewBbox(bbox: Extent) {
    const extent = transformExtent(
      bbox,
      'EPSG:4326',
      'EPSG:3857'
    )

    this.setMapView(extent)
  }

  // set map view from extent in map projection EPSG:3857 ( Web Mercator, OpenStreetmap https://epsg.io/3857 )
  setMapView(extent: Extent) {
    const mapSize = this.map.getSize()
    if (mapSize === undefined) { console.error("Map size is undefined"); return }
    const view = this.map.getView()

    view.fit(
      extent,
      { size: mapSize }
    )
  }

  // get map view extent in EPSG:3857
  getMapViewExtent() {
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    console.log(extent.join(', '))
    return extent
  }


  // get map view extent ( bounding box ) in EPSG:4326
  getMapViewBbox() {
    const bbox = transformExtent(
      this.getMapViewExtent(),
      'EPSG:3857',
      'EPSG:4326'
    )
    return bbox
  }

  setStyleFactory(stf: StyleFactoryLike) {
    this.styleFactory = stf
  }

  addTrackLayer(geoJsonWithTrack: GeoJsonWithTrack) { // geojsonwithid: { id: id, geojson: geojson }
    const geojson = geoJsonWithTrack.geojson
    const track = geoJsonWithTrack.track
    const trackId = track.id

    if (geojson === null) {
      throw new Error(`Geojson object is null when trying to add track layer for track ${trackId}`)
    }

    if (this.trackIdToLayerMap.has(trackId)) {
      console.log(`An attempt was made to add layer with track id ${trackId}, but a track with this id already exists in map layers`)
      return
    }
    const style = this.styleFactory.getNext()
    const { featureIdList, vectorLayer } = createLayerFromGeoJson(geojson, style)
    const vectorLayerId = getUid(vectorLayer)
    this.map.addLayer(vectorLayer)
    // add to maps
    this.trackIdToLayerMap.set(trackId, vectorLayer)
    this.trackMap.set(trackId, track)
    featureIdList.forEach((fid) => {
      this.featureIdMap.set(fid, { vectorLayerId, trackId })
    })
  }

  clearSelection() {
    // reset current selection
    this.selectCollection.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_DEFAULT)
    })
    this.selectCollection.clear()
  }

  // set a list of tracks as selected and
  // all other tracks will be 'deselected'
  setSelectedTracks(trackIdList: number[]) {
    const selected = trackIdList

    console.log('Warning: can only select first track of list')
    this.clearSelection()

    // do nothing
    if (selected.length === 0) return

    const trackId = selected[0]
    if (trackId === undefined) {
      throw Error("Track id is undefined")
    }
    const layer = this.getTrackLayer(trackId)
    if (layer === undefined) { console.error("Could not get layer"); return }

    const source = layer.getSource()
    if (!(source instanceof VectorSource)) { console.error("source is not of right type"); return }

    const features = source.getFeatures()
    if (features.length < 1) {
      console.error('No feature in layer', layer)
    } else if (features.length > 1) {
      console.log(`Not exactly 1 feature in layer, but: ${features.length}`)
    } else if (features[0] !== undefined) {
      this.setZIndex(features[0], this.ZINDEX_SELECTED)
      this.selectCollection.push(features[0])
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
    return featureWithId ?? undefined
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

  /**
   * Returns all track ids which are currently visible in the map
   * @returns Array of numbers
   */
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

    if (extentList.length > 0) {
      const overallBbox = new ExtentCollection(extentList).boundingBox()
      if (overallBbox) {
        this.setMapView(overallBbox)
      }
      this.zoomOut()
    } else {
      console.log("Extentlist was empty - no extent could be set")
    }
  }
}
