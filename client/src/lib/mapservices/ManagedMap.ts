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
import type { MultiLineStringWithTrack } from '@/lib/zodSchemas'
import _ from 'lodash'
import { StyleFactoryFixedColors } from '../mapStyles'
import type { StyleFactoryLike } from '../mapStyles'
import type { Track } from '@/lib/Track'
import type { Coordinate } from 'ol/coordinate'


interface SelectionObject { selected: number[], deselected: number[] }
interface FeatureIdMapMember { vectorLayerId: string, trackId: number }

export interface PopoverData {
  trackId: number
  name: string
  date: string
  distance: string
  ascent: string | null
}

export type PopoverShowCallback = (data: PopoverData) => void
export type PopoverDismissCallback = () => void


/**
 * ManagedMap - OpenLayers map wrapper for track visualization and interaction
 *
 * Manages an OpenLayers map instance with support for:
 * - Adding and managing track layers (GeoJSON-based vector layers)
 * - Track selection via map interaction or programmatic control
 * - Popover display for selected tracks with custom callbacks
 * - Map extent and zoom operations
 * - Layer visibility management
 *
 * The class handles the mapping between:
 * - Track IDs ↔ Vector layers
 * - Feature IDs ↔ Track IDs (for selection event handling)
 * - Selection events from OpenLayers → track-level callbacks
 *
 * @example
 * // See "How to use" implementation example below for Vue 3 Composition API usage
 *
 * @public
 * 
    How to use (Vue 3 Composition API):

      <template>
        <div ref="mapContainer" class="map-wrapper"></div>
      </template>

      <script setup lang="ts">
      import { ref, onMounted } from 'vue'
      import { ManagedMap } from '@/lib/mapservices/ManagedMap'
      import { getMultiLineStringWithIdList } from '@/lib/...'

      const mapContainer = ref<HTMLDivElement | null>(null)
      const mmap = ref<ManagedMap | null>(null)
      const props = defineProps<{ trackId: number }>()

      const drawTrack = async () => {
        if (!mmap.value) return
        const resultSet = await getMultiLineStringWithIdList([props.trackId], '')
        const result = resultSet[0]
        mmap.value.addTrackLayer(result)
        mmap.value.setExtentAndZoomOut()
      }

      onMounted(async () => {
        mmap.value = new ManagedMap()
        if (mapContainer.value) {
          mmap.value.map.setTarget(mapContainer.value)
        }
        await drawTrack()

        // Optional: initialize popover if needed
        // const popupEl = document.getElementById('popup-element')
        // if (popupEl) {
        //   mmap.value.initPopup(popupEl, onPopoverShow, onPopoverDismiss)
        // }
      })
      </script>
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
  onPopoverShow: PopoverShowCallback | null = null
  onPopoverDismiss: PopoverDismissCallback | null = null


  /**
   * Initialize a new ManagedMap instance with OSM base layer, selection interaction, and event handlers.
   * Creates internal maps for tracking layer-to-track and feature-to-track relationships.
   */
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

  /**
   * Initialize popover display with custom show/dismiss callbacks.
   * Enables draggable popup functionality on the map.
   *
   * @param popupElement - HTML element to use as popover container
   * @param onShow - Callback invoked when a track is selected and popover displays
   * @param onDismiss - Callback invoked when popover is closed
   */
  initPopup(popupElement: HTMLElement, onShow: PopoverShowCallback, onDismiss: PopoverDismissCallback) {
    this.popovermgr = new PopoverManager(popupElement)
    this.popovermgr.initDrag(this.map)
    this.map.addOverlay(this.popovermgr.getOverlay())
    this.onPopoverShow = onShow
    this.onPopoverDismiss = onDismiss
  }

  ZINDEX_DEFAULT = 0
  ZINDEX_SELECTED = 5

  /**
   * Create and configure the OpenLayers map instance with base OSM layer and custom controls.
   *
   * @param center - Map center coordinates [x, y] in EPSG:3857 (default: [0, 0])
   * @param zoom - Initial zoom level (default: 0)
   * @returns Configured OlMap instance
   */
  _createMap(center = [0, 0], zoom = 0) {
    const map = new OlMap({
      controls: defaultControls().extend([
        new ZoomToTracksControl({
          actionCallBack: this.setExtentAndZoomOut.bind(this)
        })
      ]),
      layers: [
        new TileLayer({
          source: new OSM({
            referrerPolicy: 'strict-origin-when-cross-origin'
          })
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
   * Process OpenLayers SelectEvent: translate feature selections to track selections.
   * Displays popover for single selections, throws error for multiple selections.
   * Dismisses popover when all selections are cleared.
   *
   * @param event - OpenLayers SelectEvent from map interaction
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

  /**
   * Convert OpenLayers SelectEvent to track-level selection object.
   * Maps feature IDs to track IDs for selected/deselected features.
   *
   * @param sEvent - OpenLayers SelectEvent
   * @returns SelectionObject with lists of selected and deselected track IDs
   */
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

  /**
   * Close and clean up the current popover, triggering the dismiss callback.
   */
  disposePopover() {
    if (!this.popovermgr) {
      console.error("Not able to show popup. No popupmanager")
      return
    } else {
      this.popovermgr.dispose()
      this.onPopoverDismiss?.()
    }
  }

  /**
   * Display popover at the given coordinate with track information.
   * Triggers the onPopoverShow callback with formatted track data.
   *
   * @param trackId - ID of track to display in popover
   * @param coord - [x, y] coordinate for popover position in map projection
   */
  showPopover(trackId: number, coord: Coordinate) {
    if (this.popovermgr) {

      const track = this.trackMap.get(trackId)

      if (!track) {
        console.error("Could not find track with id %i", trackId)
        return
      }
      const dateopts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: '2-digit', year: '2-digit' }

      this.popovermgr.setPosition(coord)
      this.onPopoverShow?.({
        trackId,
        name: track.getNameOrSrc(),
        date: track.localeDateShort(dateopts),
        distance: `${(track.distance() / 1000).toFixed()} km`,
        ascent: track.getAscent() ? `${track.getAscent().toFixed()} m` : null,
      })
    }
  }


  // set map view from bounding box in EPSG:4326 (GPS Lat Lon system https://epsg.io/4326 ) ( aka WGS84  )
  /**
   * Set map view to fit a bounding box in EPSG:4326 (WGS84 GPS coordinates).
   * Automatically transforms to EPSG:3857 (Web Mercator) for OpenLayers.
   *
   * @param bbox - [minX, minY, maxX, maxY] extent in EPSG:4326
   */
  setMapViewBbox(bbox: Extent) {
    const extent = transformExtent(
      bbox,
      'EPSG:4326',
      'EPSG:3857'
    )

    this.setMapView(extent)
  }

  // set map view from extent in map projection EPSG:3857 ( Web Mercator, OpenStreetmap https://epsg.io/3857 )
  /**
   * Set map view to fit an extent in EPSG:3857 (Web Mercator / OpenLayers native).
   *
   * @param extent - [minX, minY, maxX, maxY] in EPSG:3857
   */
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
  /**
   * Get the current map view extent in EPSG:3857 (Web Mercator).
   *
   * @returns [minX, minY, maxX, maxY] extent in EPSG:3857
   */
  getMapViewExtent() {
    const extent = this.map.getView().calculateExtent(this.map.getSize());
    console.log(extent.join(', '))
    return extent
  }


  // get map view extent ( bounding box ) in EPSG:4326
  /**
   * Get the current map view as a bounding box in EPSG:4326 (WGS84 GPS coordinates).
   * Transforms from internal EPSG:3857 projection.
   *
   * @returns [minLon, minLat, maxLon, maxLat] bbox in EPSG:4326
   */
  getMapViewBbox() {
    const bbox = transformExtent(
      this.getMapViewExtent(),
      'EPSG:3857',
      'EPSG:4326'
    )
    return bbox
  }

  /**
   * Replace the style factory used for rendering new track layers.
   *
   * @param stf - StyleFactory instance for generating layer styles
   */
  setStyleFactory(stf: StyleFactoryLike) {
    this.styleFactory = stf
  }

  /**
   * Add a track layer to the map from GeoJSON data.
   * Creates feature-to-track mappings for selection and manages internal track registry.
   * Does nothing if a layer with the same track ID already exists.
   *
   * @param multiLineStringWithTrack - GeoJSON MultiLineString with associated Track metadata
   */
  addTrackLayer(multiLineStringWithTrack: MultiLineStringWithTrack) {
    const multiLineString = multiLineStringWithTrack.geojson
    const track = multiLineStringWithTrack.track
    const trackId = track.id

    if (this.trackIdToLayerMap.has(trackId)) {
      console.log(`An attempt was made to add layer with track id ${trackId}, but a track with this id already exists in map layers`)
      return
    }
    const style = this.styleFactory.getNext()
    const { featureIdList, vectorLayer } = createLayerFromGeoJson(multiLineString, style)
    const vectorLayerId = getUid(vectorLayer)
    this.map.addLayer(vectorLayer)
    // add to maps
    this.trackIdToLayerMap.set(trackId, vectorLayer)
    this.trackMap.set(trackId, track)
    featureIdList.forEach((fid) => {
      this.featureIdMap.set(fid, { vectorLayerId, trackId })
    })
  }

  /**
   * Clear all track selections and reset their rendering z-index to default.
   */
  clearSelection() {
    // reset current selection
    this.selectCollection.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_DEFAULT)
    })
    this.selectCollection.clear()
  }

  // set a list of tracks as selected and
  // all other tracks will be 'deselected'
  /**
   * Programmatically select track(s) by ID (currently limited to single selection).
   * Clears previous selection and raises z-index of new selection for visibility.
   *
   * @param trackIdList - Array of track IDs (only first element is used)
   */
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

  /**
   * Get list of currently selected track IDs.
   *
   * @returns Array of selected track IDs
   */
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

  /**
   * Handle selection event by updating z-index of selected/deselected features.
   * Used as event handler for OpenLayers select interaction.
   *
   * @param e - OpenLayers SelectEvent
   */
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

  /**
   * Set the rendering z-index of a feature's track layer.
   *
   * @param feature - OpenLayers Feature
   * @param index - Z-index value (higher = rendered on top)
   */
  setZIndex(feature: Feature, index: number) {
    const fid = getUid(feature)
    const trackId = this.getTrackIdByFeatureId(fid)
    if (trackId === undefined) { console.error("Trackid is undefined"); return }
    const layer = this.getTrackLayer(trackId)
    if (layer === undefined) { console.error("Track id is undefined"); return }
    layer.setZIndex(index)
  }

  /**
   * Resolve a track ID from an OpenLayers Feature.
   *
   * @param feature - OpenLayers Feature object
   * @returns Track ID, or undefined if not found
   */
  getTrackIdByFeature(feature: Feature) {
    const featureId = getUid(feature)
    return this.getTrackIdByFeatureId(featureId)
  }

  /**
   * Look up internal feature metadata by feature ID.
   *
   * @param featureId - OpenLayers feature UID
   * @returns FeatureIdMapMember with vectorLayerId and trackId, or undefined if not found
   */
  getFeatureWithIdByFeatureId(featureId: string) {
    const featureWithId = this.featureIdMap.get(featureId)
    return featureWithId ?? undefined
  }

  /**
   * Resolve track ID from OpenLayers feature ID.
   *
   * @param featureId - OpenLayers feature UID
   * @returns Track ID, or undefined if feature not found
   */
  getTrackIdByFeatureId(featureId: string) {
    const featureWithId = this.getFeatureWithIdByFeatureId(featureId)
    return featureWithId ? featureWithId.trackId : undefined
  }

  /**
   * Resolve vector layer ID from OpenLayers feature ID.
   *
   * @param featureId - OpenLayers feature UID
   * @returns Vector layer ID, or undefined if feature not found
   */
  getLayerIdByFeatureId(featureId: string) {
    const featureWithId = this.getFeatureWithIdByFeatureId(featureId)
    return featureWithId ? featureWithId.vectorLayerId : undefined
  }

  /**
   * Get the vector layer for a track by ID. Throws if track not found.
   *
   * @param trackId - Track ID
   * @returns VectorLayer for the track
   * @throws Error if track layer not found
   */
  getTrackLayer(trackId: number) {
    const tl = this.trackIdToLayerMap.get(trackId)
    if (tl === undefined) throw new Error(`Could not get track layer for id ${trackId}`)
    return tl
  }

  /**
   * Make a track layer visible on the map.
   *
   * @param trackId - Track ID
   * @throws Error if track layer not found
   */
  setVisible(trackId: number) {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    layer.setVisible(true)
  }

  /**
   * Hide a track layer on the map.
   *
   * @param trackId - Track ID
   * @throws Error if track layer not found
   */
  setInvisible(trackId: number) {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    layer.setVisible(false)
  }

  /**
   * Get all track IDs currently in the map (visible and hidden).
   *
   * @returns Array of all track IDs
   */
  getTrackIds() {
    return Array.from(this.trackIdToLayerMap.keys())
  }

  /**
   * Returns all track ids which are currently visible in the map
   * @returns Array of numbers
   */
  /**
   * Get all track IDs that are currently visible in the map.
   *
   * @returns Array of visible track IDs
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

  /**
   * Get all track IDs that are currently hidden in the map.
   *
   * @returns Array of hidden track IDs
   */
  getTrackIdsInVisible() {
    const allIds = this.getTrackIds()
    return _.reject(
      allIds,
      id => {
        const layer = this.getTrackLayer(id)
        return layer ? layer.getVisible() : undefined
      })
  }

  /**
   * Animate zoom out by a factor (default 0.97 = zoom to 97% of current level).
   *
   * @param scale - Zoom scale factor (default: 0.97). Values < 1 zoom out.
   */
  zoomOut(scale = 0.97) {
    // zoom a bit out
    const view = this.map.getView()
    const zoomval = view.getZoom()
    if (zoomval === undefined) { console.error("Can not zoom"); return }
    view.animate(
      { zoom: zoomval * scale }
    )
  }

  /**
   * Zoom and pan map to fit selected tracks (or all visible tracks if none selected).
   * Calculates bounding box and applies zoom-out animation.
   */
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
      const extent = source.getExtent()
      if (extent !== null) {
        extentList.push(extent)
      }
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
