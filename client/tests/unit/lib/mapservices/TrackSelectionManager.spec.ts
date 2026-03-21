/* eslint-disable @typescript-eslint/no-empty-function */
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { TrackSelectionManager } from '@/lib/mapservices/TrackSelectionManager'
import { TrackLayerManager } from '@/lib/mapservices/TrackLayerManager'
import { Track } from '@/lib/Track'
import type { TrackInitData } from '@/lib/Track'
import type { MultiLineString } from 'geojson'
import ResizeObserverMock from '../../__mocks__/ResizeObserver'
import { Map as OlMap, View, Feature } from 'ol'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import { StyleFactoryFixedColors } from '@/lib/mapStyles'
import Select, { SelectEvent } from 'ol/interaction/Select'

// ---------------------------------------------------------------------------
// Shared test fixture data
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

function makeSelectEvent(
  selected: Feature[],
  deselected: Feature[],
  coordinate = [0, 0],
): SelectEvent {
  const evt = new SelectEvent(
    'select',
    selected,
    deselected,
    { coordinate } as never,
  )
  return evt
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('TrackSelectionManager', () => {
  let selectionManager: TrackSelectionManager
  let layerManager: TrackLayerManager
  let map: OlMap
  let styleFactory: StyleFactoryFixedColors

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    map = createTestMap()
    styleFactory = new StyleFactoryFixedColors()
    layerManager = new TrackLayerManager(map, styleFactory)
    selectionManager = new TrackSelectionManager(map, layerManager)
  })

  // -------------------------------------------------------------------------
  // Constructor / initialization
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    test('creates selection manager with empty selection', () => {
      expect(selectionManager).toBeDefined()
      expect(selectionManager.getSelectionCount()).toBe(0)
      expect(selectionManager.getSelectedTrackIds()).toEqual([])
    })

    test('adds Select interaction to map', () => {
      const interactions = map.getInteractions()
      const selectInteractions = interactions.getArray().filter(
        interaction => interaction.constructor.name === 'Select'
      )
      expect(selectInteractions.length).toBe(1)
    })
  })

  // -------------------------------------------------------------------------
  // Selection operations
  // -------------------------------------------------------------------------
  describe('programmatic selection', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })
    })

    test('selects single track', () => {
      selectionManager.setSelectedTracks([track1.id])

      expect(selectionManager.getSelectedTrackIds()).toContain(track1.id)
      expect(selectionManager.getSelectionCount()).toBe(1)
      expect(selectionManager.isTrackSelected(track1.id)).toBe(true)
      expect(selectionManager.isTrackSelected(track2.id)).toBe(false)
    })

    test('clears selection before setting new selection', () => {
      selectionManager.setSelectedTracks([track1.id])
      selectionManager.setSelectedTracks([track2.id])

      expect(selectionManager.getSelectedTrackIds()).toEqual([track2.id])
      expect(selectionManager.isTrackSelected(track1.id)).toBe(false)
      expect(selectionManager.isTrackSelected(track2.id)).toBe(true)
    })

    test('handles empty selection', () => {
      selectionManager.setSelectedTracks([track1.id])
      selectionManager.setSelectedTracks([])

      expect(selectionManager.getSelectedTrackIds()).toEqual([])
      expect(selectionManager.getSelectionCount()).toBe(0)
    })

    test('warns and selects only first track when multiple tracks provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

      selectionManager.setSelectedTracks([track1.id, track2.id])

      expect(selectionManager.getSelectedTrackIds()).toEqual([track1.id])
      expect(consoleSpy).toHaveBeenCalledWith('Warning: can only select first track of list')

      consoleSpy.mockRestore()
    })

    test('handles selection of non-existent track', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      selectionManager.setSelectedTracks([999])

      expect(selectionManager.getSelectedTrackIds()).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalledWith('Could not get layer')

      consoleErrorSpy.mockRestore()
    })

    test('clears all selections', () => {
      selectionManager.setSelectedTracks([track1.id])

      selectionManager.clearSelection()

      expect(selectionManager.getSelectedTrackIds()).toEqual([])
      expect(selectionManager.getSelectionCount()).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Z-index management
  // -------------------------------------------------------------------------
  describe('z-index management', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
    })

    test('sets z-index for selected tracks', () => {
      selectionManager.setSelectedTracks([track1.id])

      const layer = layerManager.getTrackLayer(track1.id)!
      expect(layer.getZIndex()).toBe(selectionManager.ZINDEX_SELECTED)
    })

    test('resets z-index when clearing selection', () => {
      selectionManager.setSelectedTracks([track1.id])
      selectionManager.clearSelection()

      const layer = layerManager.getTrackLayer(track1.id)!
      expect(layer.getZIndex()).toBe(selectionManager.ZINDEX_DEFAULT)
    })
  })

  // -------------------------------------------------------------------------
  // Event handling
  // -------------------------------------------------------------------------
  describe('event handling', () => {
    let eventListener: (event: Event) => void

    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      eventListener = vi.fn() as (event: Event) => void
      selectionManager.addEventListener('selection-change', eventListener)
    })

    test('emits track-selected event on programmatic selection', () => {
      selectionManager.setSelectedTracks([track1.id])

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'track-selected',
            trackIds: [track1.id]
          })
        })
      )
    })

    test('emits selection-cleared event when clearing selection', () => {
      selectionManager.setSelectedTracks([track1.id])
      selectionManager.clearSelection()

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'selection-cleared',
            trackIds: []
          })
        })
      )
    })

    test('processes select events from map interaction', () => {
      const layer = layerManager.getTrackLayer(track1.id)!
      const source = layer.getSource()!
      const features = source.getFeatures()
      const feature = features[0]

      if (!feature) {
        throw new Error('No feature found for test')
      }

      // Simulate map click selection
      const selectEvent = makeSelectEvent([feature], [], [100, 200])

      // Call the event handler directly (simulating OpenLayers event)
      const selectInteraction = map.getInteractions().getArray().find(
        interaction => interaction instanceof Select
      )!

      selectInteraction.dispatchEvent(selectEvent)

      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            type: 'track-selected',
            trackIds: [track1.id],
            coordinate: [100, 200]
          })
        })
      )
    })

    test('handles selection of unmapped features', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      const unmappedFeature = new Feature()
      const selectEvent = makeSelectEvent([unmappedFeature], [])

      const selectInteraction = map.getInteractions().getArray().find(
        interaction => interaction instanceof Select
      )!

      selectInteraction.dispatchEvent(selectEvent)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Got Track id which is undefined')
      consoleErrorSpy.mockRestore()
    })

    test('throws error for multiple track selection', () => {
      const layer1 = layerManager.getTrackLayer(track1.id)!
      const features1 = layer1.getSource()!.getFeatures()

      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })
      const layer2 = layerManager.getTrackLayer(track2.id)!
      const features2 = layer2.getSource()!.getFeatures()

      const feature1 = features1[0]
      const feature2 = features2[0]

      if (!feature1 || !feature2) {
        throw new Error('Features not found for test')
      }

      const selectEvent = makeSelectEvent([feature1, feature2], [])

      const selectInteraction = map.getInteractions().getArray().find(
        interaction => interaction instanceof Select
      )!

      expect(() => {
        selectInteraction.dispatchEvent(selectEvent)
      }).toThrow('Can not select multiple tracks at the moment')
    })
  })

  // -------------------------------------------------------------------------
  // Utility methods
  // -------------------------------------------------------------------------
  describe('utility methods', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
    })

    test('provides access to selection collection', () => {
      const collection = selectionManager.getSelectionCollection()
      expect(collection).toBeDefined()
      expect(collection.getLength()).toBe(0)

      selectionManager.setSelectedTracks([track1.id])
      expect(collection.getLength()).toBe(1)
    })

    test('checks if track is selected', () => {
      expect(selectionManager.isTrackSelected(track1.id)).toBe(false)

      selectionManager.setSelectedTracks([track1.id])
      expect(selectionManager.isTrackSelected(track1.id)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Disposal
  // -------------------------------------------------------------------------
  describe('disposal', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
    })

    test('disposes properly and removes interaction from map', () => {
      selectionManager.setSelectedTracks([track1.id])
      const initialInteractionCount = map.getInteractions().getLength()

      selectionManager.dispose()

      expect(selectionManager.getSelectedTrackIds()).toEqual([])
      expect(map.getInteractions().getLength()).toBe(initialInteractionCount - 1)
    })
  })
})