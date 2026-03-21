import { Feature, Map as OlMap } from 'ol'
import { getUid } from 'ol/util'
import type { Geometry } from 'ol/geom'
import Collection from 'ol/Collection'
import Select from 'ol/interaction/Select'
import { SelectEvent } from 'ol/interaction/Select'
import type BaseEvent from 'ol/events/Event'
import type { Coordinate } from 'ol/coordinate'
import type { TrackLayerManager } from './TrackLayerManager'
import VectorSource from 'ol/source/Vector'

interface SelectionObject {
  selected: number[]
  deselected: number[]
}

interface TrackSelectionEvent {
  type: 'track-selected' | 'track-deselected' | 'selection-cleared'
  trackIds: number[]
  coordinate?: Coordinate
}

/**
 * TrackSelectionManager handles track selection logic and interaction.
 *
 * Responsibilities:
 * - Manages OpenLayers Select interaction
 * - Tracks selection state in Collection<Feature>
 * - Handles selection events from map clicks
 * - Emits custom events for selection changes
 * - Controls visual feedback (z-index) for selections
 */
export class TrackSelectionManager extends EventTarget {
  private map: OlMap
  private layerManager: TrackLayerManager
  private selectCollection: Collection<Feature<Geometry>>
  private select: Select

  readonly ZINDEX_DEFAULT = 0
  readonly ZINDEX_SELECTED = 5

  constructor(map: OlMap, layerManager: TrackLayerManager) {
    super()
    this.map = map
    this.layerManager = layerManager

    // Setup for track select interaction
    this.selectCollection = new Collection()
    this.select = new Select({
      hitTolerance: 5,
      features: this.selectCollection
    })

    this.map.addInteraction(this.select)

    // Bind event handlers
    this.select.on(['select'], this.processSelectEvent.bind(this))
    this.select.on(['select'], this.manageZIndexOnSelect.bind(this))
  }

  /**
   * Process OpenLayers SelectEvent: translate feature selections to track selections.
   * Emits selection events for other components to handle (e.g., popover display).
   */
  private processSelectEvent(event: BaseEvent | Event): void {
    if (!(event instanceof SelectEvent)) {
      console.error("Expected SelectEvent, but did get different type")
      return
    }

    const trackIdSelectObject = this.event2selectionObject(event)
    const numSelected = trackIdSelectObject.selected.length

    if (numSelected === 0) {
      this.emitEvent('selection-cleared', [], event.mapBrowserEvent.coordinate)
      return
    }

    if (numSelected === 1) {
      const trackId = trackIdSelectObject.selected[0]
      if (trackId === undefined) {
        console.error("Track id is undefined")
        return
      }

      this.emitEvent('track-selected', [trackId], event.mapBrowserEvent.coordinate)
      return
    }

    throw Error("Can not select multiple tracks at the moment")
  }

  /**
   * Convert OpenLayers SelectEvent to track-level selection object.
   * Maps feature IDs to track IDs for selected/deselected features.
   */
  private event2selectionObject(sEvent: SelectEvent): SelectionObject {
    const trackIdSelectObject: SelectionObject = { selected: [], deselected: [] }

    sEvent.selected.forEach((feature: Feature<Geometry>) => {
      const tid = this.layerManager.getTrackIdByFeature(feature)
      if (tid === undefined) {
        console.error("Got Track id which is undefined")
      } else {
        trackIdSelectObject.selected.push(tid)
      }
    })

    sEvent.deselected.forEach((feature: Feature<Geometry>) => {
      const tid = this.layerManager.getTrackIdByFeature(feature)
      if (tid === undefined) {
        console.error("Got Track id which is undefined")
      } else {
        trackIdSelectObject.deselected.push(tid)
      }
    })

    return trackIdSelectObject
  }

  /**
   * Handle selection event by updating z-index of selected/deselected features.
   */
  private manageZIndexOnSelect(e: BaseEvent | Event): void {
    if (!(e instanceof SelectEvent)) {
      console.error("Expected SelectEvent, but did not get it")
      return
    }

    e.selected.forEach((feature) => {
      this.layerManager.setZIndex(feature, this.ZINDEX_SELECTED)
    })

    e.deselected.forEach((feature) => {
      this.layerManager.setZIndex(feature, this.ZINDEX_DEFAULT)
    })
  }

  /**
   * Emit a custom selection event.
   */
  private emitEvent(type: TrackSelectionEvent['type'], trackIds: number[], coordinate?: Coordinate): void {
    const event = new CustomEvent('selection-change', {
      detail: { type, trackIds, coordinate }
    })
    this.dispatchEvent(event)
  }

  /**
   * Clear all track selections and reset their rendering z-index to default.
   */
  clearSelection(): void {
    // Reset current selection z-index
    this.selectCollection.forEach((feature) => {
      this.layerManager.setZIndex(feature, this.ZINDEX_DEFAULT)
    })

    this.selectCollection.clear()
    this.emitEvent('selection-cleared', [])
  }

  /**
   * Programmatically select track(s) by ID (currently limited to single selection).
   * Clears previous selection and raises z-index of new selection for visibility.
   */
  setSelectedTracks(trackIdList: number[]): void {
    if (trackIdList.length > 1) {
      console.log('Warning: can only select first track of list')
    }

    this.clearSelection()

    // Do nothing if empty selection
    if (trackIdList.length === 0) return

    const trackId = trackIdList[0]
    if (trackId === undefined) {
      console.error("Track id is undefined")
      return
    }

    const layer = this.layerManager.getTrackLayer(trackId)
    if (layer === undefined) {
      console.error("Could not get layer")
      return
    }

    const source = layer.getSource()
    if (!(source instanceof VectorSource)) {
      console.error("source is not of right type")
      return
    }

    const features = source.getFeatures()
    if (features.length < 1) {
      console.error('No feature in layer', layer)
    } else if (features.length > 1) {
      console.log(`Not exactly 1 feature in layer, but: ${features.length}`)
    } else if (features[0] !== undefined) {
      this.layerManager.setZIndex(features[0], this.ZINDEX_SELECTED)
      this.selectCollection.push(features[0])
      this.emitEvent('track-selected', [trackId])
    }
  }

  /**
   * Get list of currently selected track IDs.
   */
  getSelectedTrackIds(): number[] {
    const trackIds: number[] = []

    this.selectCollection.forEach((feature) => {
      const fid = getUid(feature)
      const trackId = this.layerManager.getTrackIdByFeatureId(fid)
      if (trackId) {
        trackIds.push(trackId)
      } else {
        console.error("Track id is undefined")
      }
    })

    return trackIds
  }

  /**
   * Get the number of currently selected tracks.
   */
  getSelectionCount(): number {
    return this.selectCollection.getLength()
  }

  /**
   * Check if a specific track is currently selected.
   */
  isTrackSelected(trackId: number): boolean {
    const selectedIds = this.getSelectedTrackIds()
    return selectedIds.includes(trackId)
  }

  /**
   * Get the OpenLayers selection collection (for advanced usage).
   */
  getSelectionCollection(): Collection<Feature<Geometry>> {
    return this.selectCollection
  }

  /**
   * Dispose of the selection manager and remove interaction from map.
   */
  dispose(): void {
    this.clearSelection()
    this.map.removeInteraction(this.select)
  }
}