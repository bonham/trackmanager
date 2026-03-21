/* eslint-disable @typescript-eslint/no-empty-function */
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { TrackLayerManager } from '@/lib/mapservices/TrackLayerManager'
import { Track } from '@/lib/Track'
import type { TrackInitData } from '@/lib/Track'
import type { MultiLineString } from 'geojson'
import ResizeObserverMock from '../../__mocks__/ResizeObserver'
import { Map as OlMap, View, Feature } from 'ol'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import { StyleFactoryFixedColors } from '@/lib/mapStyles'
import { getUid } from 'ol/util'

// ---------------------------------------------------------------------------
// Shared test fixture data (from ManagedMap.spec.ts)
// ---------------------------------------------------------------------------
const multilinestring: MultiLineString = {
  type: 'MultiLineString',
  coordinates: [
    [
      [-4.103736877441406, 56.24163292831188],
      [-4.0704345703125, 56.22484046826683],
    ],
  ],
}

const makeTrack = (overrides: Partial<TrackInitData> & { id: number }) =>
  new Track({
    name: 'trackname',
    length: 10000,
    src: 'file.fit',
    ascent: 100,
    time: '2023-06-15',
    ...overrides,
  })

const track1 = makeTrack({ id: 1, name: 'track1' })
const track2 = makeTrack({ id: 2, name: 'track2' })

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
function createTestMap(): OlMap {
  return new OlMap({
    layers: [
      new TileLayer({
        source: new OSM({
          referrerPolicy: 'strict-origin-when-cross-origin'
        })
      })
    ],
    view: new View({
      center: [0, 0],
      zoom: 0
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TrackLayerManager', () => {
  let layerManager: TrackLayerManager
  let map: OlMap
  let styleFactory: StyleFactoryFixedColors

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    map = createTestMap()
    styleFactory = new StyleFactoryFixedColors()
    layerManager = new TrackLayerManager(map, styleFactory)
  })

  // -------------------------------------------------------------------------
  // Constructor / initialization
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    test('creates layer manager with provided map and style factory', () => {
      expect(layerManager).toBeDefined()
      expect(layerManager.getLayerCount()).toBe(0)
      expect(layerManager.getTrackIds()).toEqual([])
    })

    test('creates layer manager with default style factory when not provided', () => {
      const managerWithDefaultStyle = new TrackLayerManager(map)
      expect(managerWithDefaultStyle).toBeDefined()
      expect(managerWithDefaultStyle.getLayerCount()).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Style factory management
  // -------------------------------------------------------------------------
  describe('style factory', () => {
    test('allows setting a new style factory', () => {
      const newStyleFactory = new StyleFactoryFixedColors()
      layerManager.setStyleFactory(newStyleFactory)
      // We can't easily test if the style factory was set without adding internal state exposure,
      // but we can test that subsequent layer additions work correctly
      expect(() => layerManager.setStyleFactory(newStyleFactory)).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // Layer addition and management
  // -------------------------------------------------------------------------
  describe('layer management', () => {
    test('adds track layer successfully', () => {
      const initialLayerCount = map.getLayers().getLength()

      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      expect(layerManager.getLayerCount()).toBe(1)
      expect(layerManager.hasTrackLayer(track1.id)).toBe(true)
      expect(layerManager.getTrackIds()).toContain(track1.id)
      expect(map.getLayers().getLength()).toBe(initialLayerCount + 1)
    })

    test('stores track data correctly', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      const retrievedTrack = layerManager.getTrack(track1.id)
      expect(retrievedTrack).toBe(track1)
      expect(retrievedTrack?.id).toBe(track1.id)
      expect(retrievedTrack?.name).toBe('track1')
    })

    test('prevents adding duplicate tracks', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      expect(layerManager.getLayerCount()).toBe(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`track id ${track1.id}`)
      )

      consoleSpy.mockRestore()
    })

    test('adds multiple different tracks', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })

      expect(layerManager.getLayerCount()).toBe(2)
      expect(layerManager.getTrackIds()).toContain(track1.id)
      expect(layerManager.getTrackIds()).toContain(track2.id)
    })

    test('retrieves correct layer for track ID', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      const layer = layerManager.getTrackLayer(track1.id)
      expect(layer).toBeDefined()
      expect(layer?.getVisible()).toBe(true) // Default visibility
    })

    test('returns undefined for non-existent track layer', () => {
      const layer = layerManager.getTrackLayer(999)
      expect(layer).toBeUndefined()
    })

    test('returns undefined for non-existent track', () => {
      const track = layerManager.getTrack(999)
      expect(track).toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Layer removal
  // -------------------------------------------------------------------------
  describe('layer removal', () => {
    test('removes track layer successfully', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      const initialMapLayers = map.getLayers().getLength()

      layerManager.removeTrackLayer(track1.id)

      expect(layerManager.getLayerCount()).toBe(0)
      expect(layerManager.hasTrackLayer(track1.id)).toBe(false)
      expect(layerManager.getTrack(track1.id)).toBeUndefined()
      expect(map.getLayers().getLength()).toBe(initialMapLayers - 1)
    })

    test('handles removal of non-existent track gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

      layerManager.removeTrackLayer(999)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('non-existent track layer with id 999')
      )

      consoleSpy.mockRestore()
    })

    test('clears all layers successfully', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })

      layerManager.clearAllLayers()

      expect(layerManager.getLayerCount()).toBe(0)
      expect(layerManager.getTrackIds()).toEqual([])
      expect(layerManager.hasTrackLayer(track1.id)).toBe(false)
      expect(layerManager.hasTrackLayer(track2.id)).toBe(false)
    })
  })

  // -------------------------------------------------------------------------
  // Visibility management
  // -------------------------------------------------------------------------
  describe('visibility management', () => {
    test('sets track visible', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      layerManager.setVisible(track1.id)

      const layer = layerManager.getTrackLayer(track1.id)
      expect(layer?.getVisible()).toBe(true)
    })

    test('sets track invisible', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      layerManager.setInvisible(track1.id)

      const layer = layerManager.getTrackLayer(track1.id)
      expect(layer?.getVisible()).toBe(false)
    })

    test('throws error when setting visibility for non-existent track', () => {
      expect(() => layerManager.setVisible(999)).toThrow('nonexisting layer with id 999')
      expect(() => layerManager.setInvisible(999)).toThrow('nonexisting layer with id 999')
    })

    test('gets visible track IDs correctly', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })
      layerManager.setInvisible(track2.id)

      const visibleIds = layerManager.getTrackIdsVisible()
      expect(visibleIds).toContain(track1.id)
      expect(visibleIds).not.toContain(track2.id)
    })

    test('gets invisible track IDs correctly', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })
      layerManager.setInvisible(track2.id)

      const invisibleIds = layerManager.getTrackIdsInVisible()
      expect(invisibleIds).not.toContain(track1.id)
      expect(invisibleIds).toContain(track2.id)
    })
  })

  // -------------------------------------------------------------------------
  // Feature ID mapping
  // -------------------------------------------------------------------------
  describe('feature ID mapping', () => {
    test('creates feature ID mappings after adding layer', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      const layer = layerManager.getTrackLayer(track1.id)!
      const source = layer.getSource()!
      const features = source.getFeatures()

      expect(features.length).toBeGreaterThan(0)

      // Test feature ID mapping for first feature
      const feature = features[0]
      const featureId = getUid(feature)
      const mappedTrackId = layerManager.getTrackIdByFeatureId(featureId)

      expect(mappedTrackId).toBe(track1.id)
    })

    test('resolves track ID from feature object', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      const layer = layerManager.getTrackLayer(track1.id)!
      const source = layer.getSource()!
      const features = source.getFeatures()
      const feature = features[0]

      if (!feature) {
        throw new Error('No feature found for track ID resolution test')
      }

      const mappedTrackId = layerManager.getTrackIdByFeature(feature)
      expect(mappedTrackId).toBe(track1.id)
    })

    test('returns undefined for unmapped feature ID', () => {
      const trackId = layerManager.getTrackIdByFeatureId('non-existent-feature-id')
      expect(trackId).toBeUndefined()
    })

    test('resolves layer ID from feature ID', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      const layer = layerManager.getTrackLayer(track1.id)!
      const source = layer.getSource()!
      const features = source.getFeatures()
      const feature = features[0]
      const featureId = getUid(feature)

      const layerId = layerManager.getLayerIdByFeatureId(featureId)
      expect(layerId).toBeDefined()
      expect(typeof layerId).toBe('string')
    })
  })

  // -------------------------------------------------------------------------
  // Z-index management
  // -------------------------------------------------------------------------
  describe('z-index management', () => {
    test('sets z-index for feature', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })

      const layer = layerManager.getTrackLayer(track1.id)!
      const source = layer.getSource()!
      const features = source.getFeatures()
      const feature = features[0]

      if (!feature) {
        throw new Error('No feature found for z-index test')
      }

      layerManager.setZIndex(feature, 10)

      expect(layer.getZIndex()).toBe(10)
    })

    test('handles z-index setting for unmapped feature', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      const unmappedFeature = new Feature()
      layerManager.setZIndex(unmappedFeature, 5)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Track id is undefined')
      consoleErrorSpy.mockRestore()
    })
  })
})