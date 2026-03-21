import { Feature, Map as OlMap } from 'ol'
import { getUid } from 'ol/util'
import type { Geometry } from 'ol/geom'
import VectorLayer from 'ol/layer/Vector.js'
import { Vector as VectorSource } from 'ol/source'
import { createLayerFromGeoJson } from './createLayerFromGeoJson'
import type { StyleFactoryLike } from '../mapStyles'
import { StyleFactoryFixedColors } from '../mapStyles'
import type { MultiLineStringWithTrack } from '@/lib/zodSchemas'
import type { Track } from '@/lib/Track'
import _ from 'lodash'

interface FeatureIdMapMember {
  vectorLayerId: string
  trackId: number
}

/**
 * TrackLayerManager handles track layer management and OpenLayers integration.
 *
 * Responsibilities:
 * - Manages trackId ↔ VectorLayer mappings
 * - Handles feature ID to track ID relationships
 * - Controls layer visibility and z-index
 * - Integrates with StyleFactory for track styling
 * - Wraps OpenLayers layer operations
 */
export class TrackLayerManager {
  private map: OlMap
  private styleFactory: StyleFactoryLike
  private trackIdToLayerMap = new Map<number, VectorLayer<VectorSource<Feature<Geometry>>>>()
  private trackMap = new Map<number, Track>()
  private featureIdMap = new Map<string, FeatureIdMapMember>()

  constructor(map: OlMap, styleFactory?: StyleFactoryLike) {
    this.map = map
    this.styleFactory = styleFactory ?? new StyleFactoryFixedColors()
  }

  /**
   * Replace the style factory used for rendering new track layers.
   */
  setStyleFactory(styleFactory: StyleFactoryLike): void {
    this.styleFactory = styleFactory
  }

  /**
   * Add a track layer to the map from GeoJSON data.
   * Creates feature-to-track mappings for selection and manages internal track registry.
   * Does nothing if a layer with the same track ID already exists.
   */
  addTrackLayer(multiLineStringWithTrack: MultiLineStringWithTrack): void {
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

    // Add to internal maps
    this.trackIdToLayerMap.set(trackId, vectorLayer)
    this.trackMap.set(trackId, track)
    featureIdList.forEach((fid) => {
      this.featureIdMap.set(fid, { vectorLayerId, trackId })
    })
  }

  /**
   * Remove a track layer from the map and clean up internal mappings.
   */
  removeTrackLayer(trackId: number): void {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (!layer) {
      console.warn(`Attempted to remove non-existent track layer with id ${trackId}`)
      return
    }

    // Remove layer from map
    this.map.removeLayer(layer)

    // Clean up internal mappings
    this.trackIdToLayerMap.delete(trackId)
    this.trackMap.delete(trackId)

    // Clean up feature mappings
    for (const [featureId, featureData] of this.featureIdMap.entries()) {
      if (featureData.trackId === trackId) {
        this.featureIdMap.delete(featureId)
      }
    }
  }

  /**
   * Get the vector layer for a track by ID.
   */
  getTrackLayer(trackId: number): VectorLayer<VectorSource<Feature<Geometry>>> | undefined {
    return this.trackIdToLayerMap.get(trackId)
  }

  /**
   * Get the Track object by ID.
   */
  getTrack(trackId: number): Track | undefined {
    return this.trackMap.get(trackId)
  }

  /**
   * Make a track layer visible on the map.
   */
  setVisible(trackId: number): void {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) {
      throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    }
    layer.setVisible(true)
  }

  /**
   * Hide a track layer on the map.
   */
  setInvisible(trackId: number): void {
    const layer = this.trackIdToLayerMap.get(trackId)
    if (layer === undefined) {
      throw new Error(`Attempt to look up nonexisting layer with id ${trackId}`)
    }
    layer.setVisible(false)
  }

  /**
   * Get all track IDs currently in the map (visible and hidden).
   */
  getTrackIds(): number[] {
    return Array.from(this.trackIdToLayerMap.keys())
  }

  /**
   * Get all track IDs that are currently visible in the map.
   */
  getTrackIdsVisible(): number[] {
    const allIds = this.getTrackIds()
    return _.filter(allIds, id => {
      const layer = this.getTrackLayer(id)
      return layer?.getVisible() ?? false
    })
  }

  /**
   * Get all track IDs that are currently hidden in the map.
   */
  getTrackIdsInVisible(): number[] {
    const allIds = this.getTrackIds()
    return _.reject(allIds, id => {
      const layer = this.getTrackLayer(id)
      return layer?.getVisible() ?? false
    })
  }

  /**
   * Set the rendering z-index of a feature's track layer.
   */
  setZIndex(feature: Feature, index: number): void {
    const fid = getUid(feature)
    const trackId = this.getTrackIdByFeatureId(fid)
    if (trackId === undefined) {
      console.error("Track id is undefined")
      return
    }
    const layer = this.getTrackLayer(trackId)
    if (layer === undefined) {
      console.error("Layer is undefined")
      return
    }
    layer.setZIndex(index)
  }

  /**
   * Look up internal feature metadata by feature ID.
   */
  getFeatureWithIdByFeatureId(featureId: string): FeatureIdMapMember | undefined {
    return this.featureIdMap.get(featureId)
  }

  /**
   * Resolve track ID from OpenLayers feature ID.
   */
  getTrackIdByFeatureId(featureId: string): number | undefined {
    const featureWithId = this.getFeatureWithIdByFeatureId(featureId)
    return featureWithId?.trackId
  }

  /**
   * Resolve vector layer ID from OpenLayers feature ID.
   */
  getLayerIdByFeatureId(featureId: string): string | undefined {
    const featureWithId = this.getFeatureWithIdByFeatureId(featureId)
    return featureWithId?.vectorLayerId
  }

  /**
   * Resolve a track ID from an OpenLayers Feature.
   */
  getTrackIdByFeature(feature: Feature): number | undefined {
    const featureId = getUid(feature)
    return this.getTrackIdByFeatureId(featureId)
  }

  /**
   * Check if a track layer exists for the given track ID.
   */
  hasTrackLayer(trackId: number): boolean {
    return this.trackIdToLayerMap.has(trackId)
  }

  /**
   * Get the number of track layers currently managed.
   */
  getLayerCount(): number {
    return this.trackIdToLayerMap.size
  }

  /**
   * Clear all track layers from the map and internal state.
   */
  clearAllLayers(): void {
    // Remove all layers from map
    for (const layer of this.trackIdToLayerMap.values()) {
      this.map.removeLayer(layer)
    }

    // Clear internal state
    this.trackIdToLayerMap.clear()
    this.trackMap.clear()
    this.featureIdMap.clear()
  }
}