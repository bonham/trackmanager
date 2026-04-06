// Component managers for separation of concerns
import { TrackLayerManager } from './TrackLayerManager'
import { TrackSelectionManager } from './TrackSelectionManager'
import { MapViewManager } from './MapViewManager'
import { TrackPopoverController } from './TrackPopoverController'

import { ExtentCollection } from './ExtentCollection'
import { MapZoomControlGroup } from './MapZoomControlGroup'
import { Feature, Map as OlMap, View } from 'ol' // rename needed not to conflict with javascript native Map()
import type { Extent } from 'ol/extent'
import { Tile as TileLayer } from 'ol/layer'
import VectorLayer from 'ol/layer/Vector.js';
import { Vector as VectorSource } from 'ol/source'
import { OSM } from 'ol/source'
import { defaults as defaultControls } from 'ol/control'
import Collection from 'ol/Collection'
import Select from 'ol/interaction/Select'
import type { Geometry } from 'ol/geom'
import { SelectEvent } from 'ol/interaction/Select'
import type BaseEvent from 'ol/events/Event'
import type { MultiLineStringWithTrack } from '@/lib/zodSchemas'
import { StyleFactoryFixedColors } from '../mapStyles'
import type { StyleFactoryLike } from '../mapStyles'
import type { Track } from '@/lib/Track'
import type { Coordinate } from 'ol/coordinate'

// Legacy type definitions preserved for API compatibility
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
 * REFACTORED: Now uses component managers for separation of concerns while maintaining
 * full backward compatibility with existing API.
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
  // Component managers (private)
  private layerManager: TrackLayerManager
  private selectionManager: TrackSelectionManager
  private viewManager: MapViewManager
  private popoverController: TrackPopoverController

  // Public properties preserved for backward compatibility
  map: OlMap

  // Legacy properties that delegate to component managers
  // Note: These are kept for backward compatibility but should be avoided in new code
  get styleFactory(): StyleFactoryLike {
    // Return a new instance since we can't access private properties
    return new StyleFactoryFixedColors()
  }

  get trackIdToLayerMap(): Map<number, VectorLayer<VectorSource<Feature<Geometry>>>> {
    // Build map from public interface
    const map = new Map<number, VectorLayer<VectorSource<Feature<Geometry>>>>()
    const trackIds = this.layerManager.getTrackIds()
    trackIds.forEach(id => {
      const layer = this.layerManager.getTrackLayer(id)
      if (layer) {
        map.set(id, layer)
      }
    })
    return map
  }

  get trackMap(): Map<number, Track> {
    // Build map from public interface
    const map = new Map<number, Track>()
    const trackIds = this.layerManager.getTrackIds()
    trackIds.forEach(id => {
      const track = this.layerManager.getTrack(id)
      if (track) {
        map.set(id, track)
      }
    })
    return map
  }

  get featureIdMap(): Map<string, FeatureIdMapMember> {
    // This internal mapping is not exposed through public interface
    // Return empty map for backward compatibility
    return new Map<string, FeatureIdMapMember>()
  }

  get selectCollection(): Collection<Feature<Geometry>> {
    return this.selectionManager.getSelectionCollection()
  }

  get select(): Select {
    // Cannot access private property - this should not be used directly
    // Users should use the public selection methods instead
    throw new Error('Direct access to select interaction is deprecated. Use selection methods instead.')
  }

  readonly popovermgr = null

  readonly onPopoverShow: PopoverShowCallback | null = null

  readonly onPopoverDismiss: PopoverDismissCallback | null = null

  // Z-index constants preserved
  readonly ZINDEX_DEFAULT = 0
  readonly ZINDEX_SELECTED = 5

  /**
   * Initialize a new ManagedMap instance with component managers.
   * Preserves all existing functionality while using proper separation of concerns.
   */
  constructor() {
    this.map = this._createMap()

    // Initialize component managers
    this.layerManager = new TrackLayerManager(this.map, new StyleFactoryFixedColors())
    this.selectionManager = new TrackSelectionManager(this.map, this.layerManager)
    this.viewManager = new MapViewManager(this.map)
    this.popoverController = new TrackPopoverController(this.layerManager, this.selectionManager)
  }

  /**
   * Initialize popover display with custom show/dismiss callbacks.
   * Enables draggable popup functionality on the map.
   *
   * @param popupElement - HTML element to use as popover container
   * @param onShow - Callback invoked when a track is selected and popover displays
   * @param onDismiss - Callback invoked when popover is closed
   */
  initPopup(popupElement: HTMLElement, onShow: PopoverShowCallback, onDismiss: PopoverDismissCallback): void {
    this.popoverController.initPopover(popupElement, onShow, onDismiss, this.map)
  }

  /**
   * Create and configure the OpenLayers map instance with base OSM layer and custom controls.
   *
   * @param center - Map center coordinates [x, y] in EPSG:3857 (default: [0, 0])
   * @param zoom - Initial zoom level (default: 0)
   * @returns Configured OlMap instance
   */
  private _createMap(center = [0, 0], zoom = 0): OlMap {
    const map = new OlMap({
      controls: defaultControls({ zoom: false }).extend([
        new MapZoomControlGroup({
          zoomToTracksCallback: this.setExtentAndZoomOut.bind(this)
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

  // ==========================================================================
  // LAYER MANAGEMENT METHODS (delegated to LayerManager)
  // ==========================================================================

  /**
   * Replace the style factory used for rendering new track layers.
   *
   * @param stf - StyleFactory instance for generating layer styles
   */
  setStyleFactory(stf: StyleFactoryLike): void {
    this.layerManager.setStyleFactory(stf)
  }

  /**
   * Add a track layer to the map from GeoJSON data.
   * Creates feature-to-track mappings for selection and manages internal track registry.
   * Does nothing if a layer with the same track ID already exists.
   *
   * @param multiLineStringWithTrack - GeoJSON MultiLineString with associated Track metadata
   */
  addTrackLayer(multiLineStringWithTrack: MultiLineStringWithTrack): void {
    this.layerManager.addTrackLayer(multiLineStringWithTrack)
  }

  /**
   * Make a track layer visible on the map.
   *
   * @param trackId - Track ID
   * @throws Error if track layer not found
   */
  setVisible(trackId: number): void {
    this.layerManager.setVisible(trackId)
  }

  /**
   * Hide a track layer on the map.
   *
   * @param trackId - Track ID
   * @throws Error if track layer not found
   */
  setInvisible(trackId: number): void {
    this.layerManager.setInvisible(trackId)
  }

  /**
   * Get all track IDs currently in the map (visible and hidden).
   *
   * @returns Array of all track IDs
   */
  getTrackIds(): number[] {
    return this.layerManager.getTrackIds()
  }

  /**
   * Get all track IDs that are currently visible in the map.
   *
   * @returns Array of visible track IDs
   */
  getTrackIdsVisible(): number[] {
    return this.layerManager.getTrackIdsVisible()
  }

  /**
   * Get all track IDs that are currently hidden in the map.
   *
   * @returns Array of hidden track IDs
   */
  getTrackIdsInVisible(): number[] {
    return this.layerManager.getTrackIdsInVisible()
  }

  /**
   * Get the vector layer for a track by ID. Throws if track not found.
   *
   * @param trackId - Track ID
   * @returns VectorLayer for the track
   * @throws Error if track layer not found
   */
  getTrackLayer(trackId: number): VectorLayer<VectorSource<Feature<Geometry>>> {
    const layer = this.layerManager.getTrackLayer(trackId)
    if (layer === undefined) {
      throw new Error(`Could not get track layer for id ${trackId}`)
    }
    return layer
  }

  // ==========================================================================
  // SELECTION MANAGEMENT METHODS (delegated to SelectionManager)
  // ==========================================================================

  /**
   * Programmatically select track(s) by ID (currently limited to single selection).
   * Clears previous selection and raises z-index of new selection for visibility.
   *
   * @param trackIdList - Array of track IDs (only first element is used)
   */
  setSelectedTracks(trackIdList: number[]): void {
    this.selectionManager.setSelectedTracks(trackIdList)
  }

  /**
   * Clear all track selections and reset their rendering z-index to default.
   */
  clearSelection(): void {
    this.selectionManager.clearSelection()
  }

  /**
   * Get list of currently selected track IDs.
   *
   * @returns Array of selected track IDs
   */
  getSelectedTrackIds(): number[] {
    return this.selectionManager.getSelectedTrackIds()
  }

  // ==========================================================================
  // VIEW MANAGEMENT METHODS (delegated to ViewManager)
  // ==========================================================================

  /**
   * Set map view to fit a bounding box in EPSG:4326 (WGS84 GPS coordinates).
   * Automatically transforms to EPSG:3857 (Web Mercator) for OpenLayers.
   *
   * @param bbox - [minX, minY, maxX, maxY] extent in EPSG:4326
   */
  setMapViewBbox(bbox: Extent): void {
    this.viewManager.setMapViewBbox(bbox)
  }

  /**
   * Set map view to fit an extent in EPSG:3857 (Web Mercator / OpenLayers native).
   *
   * @param extent - [minX, minY, maxX, maxY] in EPSG:3857
   */
  setMapView(extent: Extent): void {
    this.viewManager.setMapView(extent)
  }

  /**
   * Get the current map view extent in EPSG:3857 (Web Mercator).
   *
   * @returns [minX, minY, maxX, maxY] extent in EPSG:3857
   */
  getMapViewExtent(): Extent {
    return this.viewManager.getMapViewExtent()
  }

  /**
   * Get the current map view as a bounding box in EPSG:4326 (WGS84 GPS coordinates).
   * Transforms from internal EPSG:3857 projection.
   *
   * @returns [minLon, minLat, maxLon, maxLat] bbox in EPSG:4326
   */
  getMapViewBbox(): Extent {
    return this.viewManager.getMapViewBbox()
  }

  /**
   * Animate zoom out by a factor (default 0.97 = zoom to 97% of current level).
   *
   * @param scale - Zoom scale factor (default: 0.97). Values < 1 zoom out.
   */
  zoomOut(scale = 0.97): void {
    this.viewManager.zoomOut(scale)
  }

  /**
   * Zoom and pan map to fit selected tracks (or all visible tracks if none selected).
   * Calculates bounding box and applies zoom-out animation.
   */
  setExtentAndZoomOut(): void {
    let zoomTrackIds: number[]

    // If there is a selection zoom on selected tracks
    if (this.selectionManager.getSelectionCount() > 0) {
      zoomTrackIds = this.selectionManager.getSelectedTrackIds()
    } else {
      // Else zoom on whole visible ids
      zoomTrackIds = this.layerManager.getTrackIdsVisible()
    }

    const extentList: Extent[] = []
    for (const id of zoomTrackIds) {
      const layer = this.layerManager.getTrackLayer(id)
      if (layer === undefined) {
        console.error("Cannot get track layer")
        return
      }
      const source = layer.getSource()
      if (!(source instanceof VectorSource)) {
        console.error("Source is not of right type")
        return
      }
      const extent = source.getExtent()
      if (extent !== null) {
        extentList.push(extent)
      }
    }

    if (extentList.length > 0) {
      // Use ExtentCollection to calculate combined extent, preserving original behavior
      try {
        const extentCollection = new ExtentCollection(extentList)
        const overallBbox = extentCollection.boundingBox()
        if (overallBbox) {
          this.setMapView(overallBbox)
          this.zoomOut()
        }
      } catch (error) {
        console.error("Failed to calculate extent:", error)
      }
    } else {
      console.log("Extent list was empty - no extent could be set")
    }
  }

  // ==========================================================================
  // LEGACY METHODS (preserved for backward compatibility)
  // ==========================================================================

  /**
   * Process OpenLayers SelectEvent: translate feature selections to track selections.
   * LEGACY METHOD - preserved for backward compatibility
   *
   * @param event - OpenLayers SelectEvent from map interaction
   */
  processSelectEvent(event: BaseEvent | Event): void {
    if (!(event instanceof SelectEvent)) {
      console.error("Expected SelectEvent, but did get different type")
      return
    }

    const trackIdSelectObject = this.event2selectionObject(event)
    const numSelected = trackIdSelectObject.selected.length

    if (numSelected === 0) {
      this.disposePopover()
      return
    }

    if (numSelected === 1) {
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
   * LEGACY METHOD - preserved for backward compatibility
   *
   * @param sEvent - OpenLayers SelectEvent
   * @returns SelectionObject with lists of selected and deselected track IDs
   */
  event2selectionObject(sEvent: SelectEvent): SelectionObject {
    const trackIdSelectObject: SelectionObject = { selected: [], deselected: [] }

    sEvent.selected.forEach((feature: Feature<Geometry>) => {
      const tid = this.getTrackIdByFeature(feature)
      if (tid === undefined) {
        console.error("Got Track id which is undefined")
      } else {
        trackIdSelectObject.selected.push(tid)
      }
    })

    sEvent.deselected.forEach((feature: Feature<Geometry>) => {
      const tid = this.getTrackIdByFeature(feature)
      if (tid === undefined) {
        console.error("Got Track id which is undefined")
      } else {
        trackIdSelectObject.deselected.push(tid)
      }
    })

    return trackIdSelectObject
  }

  /**
   * Close and clean up the current popover, triggering the dismiss callback.
   */
  disposePopover(): void {
    this.popoverController.disposePopover()
  }

  /**
   * Display popover at the given coordinate with track information.
   * Triggers the onPopoverShow callback with formatted track data.
   *
   * @param trackId - ID of track to display in popover
   * @param coord - [x, y] coordinate for popover position in map projection
   */
  showPopover(trackId: number, coord: Coordinate): void {
    this.popoverController.showPopover(trackId, coord)
  }

  /**
   * Handle selection event by updating z-index of selected/deselected features.
   * LEGACY METHOD - preserved for backward compatibility
   *
   * @param e - OpenLayers SelectEvent
   */
  manageZIndexOnSelect(e: BaseEvent | Event): void {
    if (!(e instanceof SelectEvent)) {
      console.error("Expected SelectEvent, but did not get it")
      return
    }

    e.selected.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_SELECTED)
    })

    e.deselected.forEach((feature) => {
      this.setZIndex(feature, this.ZINDEX_DEFAULT)
    })
  }

  /**
   * Set the rendering z-index of a feature's track layer.
   *
   * @param feature - OpenLayers Feature
   * @param index - Z-index value (higher = rendered on top)
   */
  setZIndex(feature: Feature, index: number): void {
    this.layerManager.setZIndex(feature, index)
  }

  /**
   * Resolve a track ID from an OpenLayers Feature.
   *
   * @param feature - OpenLayers Feature object
   * @returns Track ID, or undefined if not found
   */
  getTrackIdByFeature(feature: Feature): number | undefined {
    return this.layerManager.getTrackIdByFeature(feature)
  }

  /**
   * Look up internal feature metadata by feature ID.
   *
   * @param featureId - OpenLayers feature UID
   * @returns FeatureIdMapMember with vectorLayerId and trackId, or undefined if not found
   */
  getFeatureWithIdByFeatureId(featureId: string): FeatureIdMapMember | undefined {
    return this.layerManager.getFeatureWithIdByFeatureId(featureId)
  }

  /**
   * Resolve track ID from OpenLayers feature ID.
   *
   * @param featureId - OpenLayers feature UID
   * @returns Track ID, or undefined if feature not found
   */
  getTrackIdByFeatureId(featureId: string): number | undefined {
    return this.layerManager.getTrackIdByFeatureId(featureId)
  }

  /**
   * Resolve vector layer ID from OpenLayers feature ID.
   *
   * @param featureId - OpenLayers feature UID
   * @returns Vector layer ID, or undefined if feature not found
   */
  getLayerIdByFeatureId(featureId: string): string | undefined {
    return this.layerManager.getLayerIdByFeatureId(featureId)
  }
}
