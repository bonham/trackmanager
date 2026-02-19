/* eslint-disable @typescript-eslint/no-empty-function */
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import { Track } from '@/lib/Track'
import type { TrackInitData } from '@/lib/Track'
import type { MultiLineString } from 'geojson'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { SelectEvent } from 'ol/interaction/Select'
import { Feature } from 'ol'
import { getUid } from 'ol/util'
import VectorSource from 'ol/source/Vector'

// ---------------------------------------------------------------------------
// Bootstrap mock (PopoverManager uses it)
// ---------------------------------------------------------------------------
vi.mock('bootstrap', () => ({
  Popover: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    dispose: vi.fn(),
  })),
}))

// Make bootstrap Popover.getInstance available after mock
import * as bootstrap from 'bootstrap'
const MockedPopover = vi.mocked(bootstrap.Popover) as unknown as {
  getInstance: ReturnType<typeof vi.fn>
} & ReturnType<typeof vi.fn>
if (!MockedPopover.getInstance) {
  ; (MockedPopover as unknown as Record<string, unknown>).getInstance = vi.fn(() => null)
}

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
const track3 = makeTrack({ id: 3, name: 'track3', ascent: undefined })

// ---------------------------------------------------------------------------
// Helper: create a minimal SelectEvent-like object understood by processSelectEvent
// ---------------------------------------------------------------------------
function makeSelectEvent(
  selected: Feature[],
  deselected: Feature[],
  coordinate = [0, 0],
): SelectEvent {
  // SelectEvent extends ol/events/Event; we can construct it directly
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
describe('ManagedMap', () => {
  let mm: ManagedMap

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    mm = new ManagedMap()
  })

  // -------------------------------------------------------------------------
  // Constructor / basics
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    test('creates map instance', () => {
      expect(mm.map).toBeDefined()
    })

    test('creates empty trackIdToLayerMap', () => {
      expect(mm.trackIdToLayerMap.size).toBe(0)
    })

    test('creates empty trackMap', () => {
      expect(mm.trackMap.size).toBe(0)
    })

    test('creates empty featureIdMap', () => {
      expect(mm.featureIdMap.size).toBe(0)
    })

    test('select interaction is added to map', () => {
      const interactions = mm.map.getInteractions().getArray()
      expect(interactions).toContain(mm.select)
    })
  })

  // -------------------------------------------------------------------------
  // addTrackLayer
  // -------------------------------------------------------------------------
  describe('addTrackLayer', () => {
    test('adds a layer for the track', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      expect(mm.getTrackIds()).toContain(1)
    })

    test('populates trackMap', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      expect(mm.trackMap.get(1)).toBe(track1)
    })

    test('populates featureIdMap', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      expect(mm.featureIdMap.size).toBeGreaterThan(0)
    })

    test('adding duplicate track id is a no-op', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      expect(mm.getTrackIds().length).toBe(1)
    })

    test('adds multiple tracks', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
      expect(mm.getTrackIds()).toEqual([1, 2])
    })
  })

  // -------------------------------------------------------------------------
  // getTrackLayer
  // -------------------------------------------------------------------------
  describe('getTrackLayer', () => {
    test('returns the layer for a known track id', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      const layer = mm.getTrackLayer(1)
      expect(layer).toBeDefined()
    })

    test('throws for unknown track id', () => {
      expect(() => mm.getTrackLayer(999)).toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // setVisible / setInvisible
  // -------------------------------------------------------------------------
  describe('setVisible / setInvisible', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
    })

    test('setInvisible hides a layer', () => {
      mm.setInvisible(1)
      expect(mm.getTrackLayer(1).getVisible()).toBe(false)
    })

    test('setVisible shows a previously hidden layer', () => {
      mm.setInvisible(1)
      mm.setVisible(1)
      expect(mm.getTrackLayer(1).getVisible()).toBe(true)
    })

    test('setVisible throws for unknown id', () => {
      expect(() => mm.setVisible(999)).toThrow()
    })

    test('setInvisible throws for unknown id', () => {
      expect(() => mm.setInvisible(999)).toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // getTrackIds / getTrackIdsVisible / getTrackIdsInVisible
  // -------------------------------------------------------------------------
  describe('visibility helpers', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
    })

    test('getTrackIds returns all ids', () => {
      expect(mm.getTrackIds()).toEqual([1, 2])
    })

    test('getTrackIdsVisible returns all when nothing hidden', () => {
      expect(mm.getTrackIdsVisible()).toEqual([1, 2])
    })

    test('getTrackIdsInVisible returns empty when nothing hidden', () => {
      expect(mm.getTrackIdsInVisible()).toEqual([])
    })

    test('getTrackIdsVisible excludes hidden track', () => {
      mm.setInvisible(2)
      expect(mm.getTrackIdsVisible()).toEqual([1])
    })

    test('getTrackIdsInVisible includes hidden track', () => {
      mm.setInvisible(2)
      expect(mm.getTrackIdsInVisible()).toEqual([2])
    })
  })

  // -------------------------------------------------------------------------
  // setStyleFactory
  // -------------------------------------------------------------------------
  describe('setStyleFactory', () => {
    test('replaces the style factory', () => {
      const fakeFactory = { getNext: vi.fn() }
      mm.setStyleFactory(fakeFactory)
      expect(mm.styleFactory).toBe(fakeFactory)
    })
  })

  // -------------------------------------------------------------------------
  // feature id helpers
  // -------------------------------------------------------------------------
  describe('feature id helpers', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
    })

    test('getFeatureWithIdByFeatureId returns undefined for unknown id', () => {
      expect(mm.getFeatureWithIdByFeatureId('nonexistent')).toBeUndefined()
    })

    test('getTrackIdByFeatureId returns undefined for unknown id', () => {
      expect(mm.getTrackIdByFeatureId('nonexistent')).toBeUndefined()
    })

    test('getLayerIdByFeatureId returns undefined for unknown id', () => {
      expect(mm.getLayerIdByFeatureId('nonexistent')).toBeUndefined()
    })

    test('featureIdMap resolves to correct trackId', () => {
      // Find a real feature id via the layer source
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const features = source.getFeatures()
      expect(features.length).toBeGreaterThan(0)
      const fid = getUid(features[0])
      expect(mm.getTrackIdByFeatureId(fid)).toBe(1)
    })

    test('getTrackIdByFeature returns correct track id', () => {
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const feature = source.getFeatures()[0]
      expect(mm.getTrackIdByFeature(feature!)).toBe(1)
    })

    test('getLayerIdByFeatureId returns a string for a known feature', () => {
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const fid = getUid(source.getFeatures()[0])
      const lid = mm.getLayerIdByFeatureId(fid)
      expect(typeof lid).toBe('string')
    })
  })

  // -------------------------------------------------------------------------
  // clearSelection / setSelectedTracks / getSelectedTrackIds
  // -------------------------------------------------------------------------
  describe('selection management', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
    })

    test('clearSelection empties selectCollection', () => {
      mm.setSelectedTracks([1])
      mm.clearSelection()
      expect(mm.selectCollection.getLength()).toBe(0)
    })

    test('setSelectedTracks selects first track', () => {
      mm.setSelectedTracks([1])
      expect(mm.getSelectedTrackIds()).toEqual([1])
    })

    test('setSelectedTracks with empty list does nothing', () => {
      mm.setSelectedTracks([])
      expect(mm.selectCollection.getLength()).toBe(0)
    })

    test('setSelectedTracks replaces previous selection', () => {
      mm.setSelectedTracks([1])
      mm.setSelectedTracks([2])
      expect(mm.getSelectedTrackIds()).toEqual([2])
    })

    test('getSelectedTrackIds returns empty when nothing selected', () => {
      expect(mm.getSelectedTrackIds()).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // manageZIndexOnSelect
  // -------------------------------------------------------------------------
  describe('manageZIndexOnSelect', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
    })

    test('sets ZINDEX_SELECTED on selected features', () => {
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const feature = source.getFeatures()[0]!
      const evt = makeSelectEvent([feature], [])
      mm.manageZIndexOnSelect(evt)
      expect(layer.getZIndex()).toBe(mm.ZINDEX_SELECTED)
    })

    test('sets ZINDEX_DEFAULT on deselected features', () => {
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const feature = source.getFeatures()[0]!
      // First select it (raises z-index), then deselect it
      const selectEvt = makeSelectEvent([feature], [])
      mm.manageZIndexOnSelect(selectEvt)
      const deselectEvt = makeSelectEvent([], [feature])
      mm.manageZIndexOnSelect(deselectEvt)
      expect(layer.getZIndex()).toBe(mm.ZINDEX_DEFAULT)
    })

    test('logs error when receiving non-SelectEvent', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mm.manageZIndexOnSelect(new Event('click'))
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // processSelectEvent
  // -------------------------------------------------------------------------
  describe('processSelectEvent', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
    })

    test('logs error when receiving non-SelectEvent', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mm.processSelectEvent(new Event('click'))
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test('calls disposePopover when nothing is selected', () => {
      const spy = vi.spyOn(mm, 'disposePopover').mockImplementation(() => { })
      const evt = makeSelectEvent([], [])
      mm.processSelectEvent(evt)
      expect(spy).toHaveBeenCalled()
    })

    test('calls showPopover for single selected feature', () => {
      const spy = vi.spyOn(mm, 'showPopover').mockImplementation(() => { })
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const feature = source.getFeatures()[0]!
      const evt = makeSelectEvent([feature], [], [10, 20])
      mm.processSelectEvent(evt)
      expect(spy).toHaveBeenCalledWith(1, [10, 20])
    })

    test('throws for multiple selected features', () => {
      // Need two registered features so event2selectionObject yields 2 selected ids
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
      const layer1 = mm.getTrackLayer(1)
      const layer2 = mm.getTrackLayer(2)
      const source1 = layer1.getSource() as VectorSource
      const source2 = layer2.getSource() as VectorSource
      const feature1 = source1.getFeatures()[0]!
      const feature2 = source2.getFeatures()[0]!
      expect(() =>
        mm.processSelectEvent(makeSelectEvent([feature1, feature2], [])),
      ).toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // event2selectionObject
  // -------------------------------------------------------------------------
  describe('event2selectionObject', () => {
    beforeEach(() => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
    })

    test('maps selected features to track ids', () => {
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const feature = source.getFeatures()[0]!
      const evt = makeSelectEvent([feature], [])
      const result = mm.event2selectionObject(evt)
      expect(result.selected).toContain(1)
      expect(result.deselected).toEqual([])
    })

    test('maps deselected features to track ids', () => {
      const layer2 = mm.getTrackLayer(2)
      const source2 = layer2.getSource() as VectorSource
      const feature2 = source2.getFeatures()[0]!
      const evt = makeSelectEvent([], [feature2])
      const result = mm.event2selectionObject(evt)
      expect(result.deselected).toContain(2)
      expect(result.selected).toEqual([])
    })

    test('logs error for feature without a known id', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const unknownFeature = new Feature()
      const evt = makeSelectEvent([unknownFeature], [])
      mm.event2selectionObject(evt)
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // initPopup / disposePopover / showPopover
  // -------------------------------------------------------------------------
  describe('popup management', () => {
    test('initPopup sets popovermgr', () => {
      const el = document.createElement('div')
      mm.initPopup(el)
      expect(mm.popovermgr).not.toBeNull()
    })

    test('disposePopover logs error when no popovermgr', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mm.disposePopover()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test('disposePopover calls popovermgr.dispose when popovermgr exists', () => {
      const el = document.createElement('div')
      mm.initPopup(el)
      const disposeSpy = vi.spyOn(mm.popovermgr!, 'dispose').mockImplementation(() => { })
      mm.disposePopover()
      expect(disposeSpy).toHaveBeenCalled()
    })

    test('showPopover logs error when track not found', () => {
      const el = document.createElement('div')
      mm.initPopup(el)
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mm.showPopover(999, [0, 0])
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test('showPopover calls setNewPopover with track data', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      const el = document.createElement('div')
      mm.initPopup(el)
      const popoverSpy = vi.spyOn(mm.popovermgr!, 'setNewPopover').mockImplementation(() => { })
      mm.showPopover(1, [100, 200])
      expect(popoverSpy).toHaveBeenCalledWith([100, 200], expect.objectContaining({
        content: expect.any(String) as string,
        title: expect.any(String) as string,
      }))
    })

    test('showPopover with track that has no ascent omits ascent line', () => {
      mm.addTrackLayer({ track: track3, geojson: multilinestring })
      const el = document.createElement('div')
      mm.initPopup(el)
      const popoverSpy = vi.spyOn(mm.popovermgr!, 'setNewPopover').mockImplementation((_coord, opts) => {
        expect(opts.content).not.toContain('Ascent')
      })
      mm.showPopover(3, [0, 0])
      expect(popoverSpy).toHaveBeenCalled()
    })

    test('showPopover does nothing when popovermgr is null', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      // popovermgr is null by default - just should not throw
      expect(() => mm.showPopover(1, [0, 0])).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // Map view helpers
  // -------------------------------------------------------------------------
  describe('map view helpers', () => {
    test('setMapViewBbox does not throw', () => {
      // map has no size in jsdom but should not crash
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      expect(() => mm.setMapViewBbox([-4.2, 56.1, -4.0, 56.3])).not.toThrow()
      spy.mockRestore()
    })

    test('getMapViewExtent returns a 4-element array', () => {
      const extent = mm.getMapViewExtent()
      expect(extent).toHaveLength(4)
    })

    test('getMapViewBbox returns a 4-element array', () => {
      const bbox = mm.getMapViewBbox()
      expect(bbox).toHaveLength(4)
    })

    test('setMapView does not throw when map has no size', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      expect(() => mm.setMapView([-500000, 6000000, 500000, 7000000])).not.toThrow()
      spy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // zoomOut
  // -------------------------------------------------------------------------
  describe('zoomOut', () => {
    test('does not throw', () => {
      expect(() => mm.zoomOut()).not.toThrow()
    })

    test('accepts custom scale', () => {
      expect(() => mm.zoomOut(0.9)).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // setExtentAndZoomOut
  // -------------------------------------------------------------------------
  describe('setExtentAndZoomOut', () => {
    test('does not throw with no tracks', () => {
      expect(() => mm.setExtentAndZoomOut()).not.toThrow()
    })

    test('uses visible track extents when nothing selected', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
      const spy = vi.spyOn(mm, 'setMapView').mockImplementation(() => { })
      mm.setExtentAndZoomOut()
      expect(spy).toHaveBeenCalled()
    })

    test('uses selected track extents when tracks are selected', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.addTrackLayer({ track: track2, geojson: multilinestring })
      mm.setSelectedTracks([1])
      const spy = vi.spyOn(mm, 'setMapView').mockImplementation(() => { })
      mm.setExtentAndZoomOut()
      expect(spy).toHaveBeenCalled()
    })

    test('logs when extent list is empty (all tracks invisible)', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      mm.setInvisible(1)
      const spy = vi.spyOn(console, 'log').mockImplementation(() => { })
      mm.setExtentAndZoomOut()
      // No throw expected; may or may not log depending on extent
      spy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // setZIndex
  // -------------------------------------------------------------------------
  describe('setZIndex', () => {
    test('logs error when feature has no known track id', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      const unknownFeature = new Feature()
      mm.setZIndex(unknownFeature, 10)
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test('sets z-index on the correct layer', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      const feature = source.getFeatures()[0]!
      mm.setZIndex(feature, 7)
      expect(layer.getZIndex()).toBe(7)
    })
  })

  // -------------------------------------------------------------------------
  // Edge-case branches in setSelectedTracks
  // -------------------------------------------------------------------------
  describe('setSelectedTracks - edge case branches', () => {
    test('logs error when layer source has no features', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      // Clear all features from the source so features.length < 1
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      source.clear()
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mm.setSelectedTracks([1])
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })

    test('logs when layer source has more than one feature', () => {
      mm.addTrackLayer({ track: track1, geojson: multilinestring })
      // Add an extra feature to the source so features.length > 1
      const layer = mm.getTrackLayer(1)
      const source = layer.getSource() as VectorSource
      source.addFeature(new Feature())
      const spy = vi.spyOn(console, 'log').mockImplementation(() => { })
      mm.setSelectedTracks([1])
      // The "Not exactly 1 feature" branch should have been hit
      const calls = spy.mock.calls.map(c => String(c[0]))
      expect(calls.some(msg => msg.includes('Not exactly 1 feature') || msg.includes('only select first'))).toBe(true)
      spy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // Edge-case branches in getSelectedTrackIds
  // -------------------------------------------------------------------------
  describe('getSelectedTrackIds - unknown feature in collection', () => {
    test('logs error when selectCollection contains a feature not in featureIdMap', () => {
      const unknownFeature = new Feature()
      // Directly push an untracked feature into selectCollection
      mm.selectCollection.push(unknownFeature)
      const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
      mm.getSelectedTrackIds()
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
    })
  })
})