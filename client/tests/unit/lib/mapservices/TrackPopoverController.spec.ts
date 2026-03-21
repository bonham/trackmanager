/* eslint-disable @typescript-eslint/no-empty-function */
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { TrackPopoverController, type PopoverShowCallback, type PopoverDismissCallback } from '@/lib/mapservices/TrackPopoverController'
import { TrackLayerManager } from '@/lib/mapservices/TrackLayerManager'
import { TrackSelectionManager } from '@/lib/mapservices/TrackSelectionManager'
import { Track } from '@/lib/Track'
import type { TrackInitData } from '@/lib/Track'
import type { MultiLineString } from 'geojson'
import ResizeObserverMock from '../../__mocks__/ResizeObserver'
import { Map as OlMap, View } from 'ol'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import { StyleFactoryFixedColors } from '@/lib/mapStyles'

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
// Mock PopoverManager
// ---------------------------------------------------------------------------
const mockPopoverManager = vi.hoisted(() => ({
  initDrag: vi.fn(),
  getOverlay: vi.fn(() => ({
    getPosition: vi.fn(() => [0, 0]),
  })),
  setPosition: vi.fn(),
  dispose: vi.fn(),
}))

vi.mock('@/lib/mapservices/PopoverManager', () => ({
  PopoverManager: vi.fn(function (this: typeof mockPopoverManager) {
    this.initDrag = mockPopoverManager.initDrag
    this.getOverlay = mockPopoverManager.getOverlay
    this.setPosition = mockPopoverManager.setPosition
    this.dispose = mockPopoverManager.dispose
  }),
}))

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
const track2 = makeTrack({ id: 2, name: 'track2', ascent: undefined })

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
describe('TrackPopoverController', () => {
  let popoverController: TrackPopoverController
  let layerManager: TrackLayerManager
  let selectionManager: TrackSelectionManager
  let map: OlMap
  let styleFactory: StyleFactoryFixedColors
  let mockShowCallback: ReturnType<typeof vi.fn>
  let mockDismissCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.clearAllMocks()

    map = createTestMap()
    styleFactory = new StyleFactoryFixedColors()
    layerManager = new TrackLayerManager(map, styleFactory)
    selectionManager = new TrackSelectionManager(map, layerManager)
    popoverController = new TrackPopoverController(layerManager, selectionManager)

    mockShowCallback = vi.fn()
    mockDismissCallback = vi.fn()
  })

  // -------------------------------------------------------------------------
  // Constructor / initialization
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    test('creates popover controller with managers', () => {
      expect(popoverController).toBeDefined()
      expect(popoverController.isPopoverActive()).toBe(false)
    })

    test('sets up selection event listeners', () => {
      // Event listeners are set up in constructor
      // We'll test their functionality in the event handling section
      expect(popoverController).toBeDefined()
    })
  })

  // -------------------------------------------------------------------------
  // Popover initialization
  // -------------------------------------------------------------------------
  describe('popover initialization', () => {
    test('initializes popover successfully', () => {
      const mockElement = document.createElement('div')
      const mockMapAddOverlay = vi.fn()
      const mockMap = { addOverlay: mockMapAddOverlay } as unknown as OlMap

      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )

      expect(popoverController.isPopoverActive()).toBe(true)
      expect(mockPopoverManager.initDrag).toHaveBeenCalledWith(mockMap)
      expect(mockMapAddOverlay).toHaveBeenCalled()
    })

    test('stores callbacks correctly', () => {
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap

      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )

      // We can't directly test if callbacks are stored, but we can test if they're called
      // This will be tested in the show/dismiss functionality tests
      expect(popoverController.isPopoverActive()).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Popover display
  // -------------------------------------------------------------------------
  describe('popover display', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap
      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )
    })

    test('shows popover with track data', () => {
      const coordinate = [100, 200]

      popoverController.showPopover(track1.id, coordinate)

      expect(mockPopoverManager.setPosition).toHaveBeenCalledWith(coordinate)
      expect(mockShowCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: track1.id,
          name: expect.any(String),
          date: expect.any(String),
          distance: expect.any(String),
          ascent: expect.any(String),
        })
      )
    })

    test('shows popover with null ascent for tracks without elevation', () => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track2 })

      popoverController.showPopover(track2.id, [0, 0])

      expect(mockShowCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: track2.id,
          ascent: null,
        })
      )
    })

    test('handles showing popover for non-existent track', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      popoverController.showPopover(999, [0, 0])

      expect(consoleErrorSpy).toHaveBeenCalledWith('Could not find track with id 999')
      expect(mockShowCallback).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    test('handles showing popover without initialization', () => {
      const uninitializedController = new TrackPopoverController(layerManager, selectionManager)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      uninitializedController.showPopover(track1.id, [0, 0])

      expect(consoleErrorSpy).toHaveBeenCalledWith('Not able to show popup. No popupmanager')

      consoleErrorSpy.mockRestore()
    })

    test('shows popover for track programmatically', () => {
      popoverController.showPopoverForTrack(track1.id, [100, 200])

      expect(mockShowCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: track1.id,
        })
      )
    })
  })

  // -------------------------------------------------------------------------
  // Popover disposal
  // -------------------------------------------------------------------------
  describe('popover disposal', () => {
    beforeEach(() => {
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap
      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )
    })

    test('disposes popover successfully', () => {
      popoverController.disposePopover()

      expect(mockPopoverManager.dispose).toHaveBeenCalled()
      expect(mockDismissCallback).toHaveBeenCalled()
    })

    test('handles disposal without initialization', () => {
      const uninitializedController = new TrackPopoverController(layerManager, selectionManager)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      uninitializedController.disposePopover()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Not able to dispose popup. No popupmanager')

      consoleErrorSpy.mockRestore()
    })

    test('hides popover without triggering dismiss callback', () => {
      popoverController.hidePopover()

      expect(mockPopoverManager.dispose).toHaveBeenCalled()
      expect(mockDismissCallback).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Event handling integration
  // -------------------------------------------------------------------------
  describe('event handling integration', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap
      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )
    })

    test('responds to track selection events', () => {
      // Simulate selection event
      const mockEvent = new CustomEvent('selection-change', {
        detail: {
          type: 'track-selected',
          trackIds: [track1.id],
          coordinate: [100, 200]
        }
      })

      selectionManager.dispatchEvent(mockEvent)

      expect(mockShowCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          trackId: track1.id,
        })
      )
    })

    test('responds to selection cleared events', () => {
      const mockEvent = new CustomEvent('selection-change', {
        detail: {
          type: 'selection-cleared',
          trackIds: [],
        }
      })

      selectionManager.dispatchEvent(mockEvent)

      expect(mockDismissCallback).toHaveBeenCalled()
    })

    test('responds to track deselected events', () => {
      const mockEvent = new CustomEvent('selection-change', {
        detail: {
          type: 'track-deselected',
          trackIds: [track1.id],
        }
      })

      selectionManager.dispatchEvent(mockEvent)

      expect(mockDismissCallback).toHaveBeenCalled()
    })

    test('handles unknown selection event types', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

      const mockEvent = new CustomEvent('selection-change', {
        detail: {
          type: 'unknown-event',
          trackIds: [],
        }
      })

      selectionManager.dispatchEvent(mockEvent)

      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown selection event type')

      consoleWarnSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // Position management
  // -------------------------------------------------------------------------
  describe('position management', () => {
    beforeEach(() => {
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap
      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )
    })

    test('gets popover position', () => {
      const position = popoverController.getPopoverPosition()
      expect(position).toEqual([0, 0])
    })

    test('returns null position when not initialized', () => {
      const uninitializedController = new TrackPopoverController(layerManager, selectionManager)
      expect(uninitializedController.getPopoverPosition()).toBeNull()
    })

    test('sets popover position manually', () => {
      const coordinate = [300, 400]

      popoverController.setPopoverPosition(coordinate)

      expect(mockPopoverManager.setPosition).toHaveBeenCalledWith(coordinate)
    })

    test('handles manual positioning without initialization', () => {
      const uninitializedController = new TrackPopoverController(layerManager, selectionManager)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      uninitializedController.setPopoverPosition([0, 0])

      expect(consoleErrorSpy).toHaveBeenCalledWith('No popover manager available for positioning')

      consoleErrorSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // Data formatting
  // -------------------------------------------------------------------------
  describe('data formatting', () => {
    beforeEach(() => {
      layerManager.addTrackLayer({ geojson: multilinestring, track: track1 })
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap
      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )
    })

    test('formats track data correctly', () => {
      popoverController.showPopover(track1.id, [0, 0])

      expect(mockShowCallback).toHaveBeenCalledWith({
        trackId: track1.id,
        name: expect.any(String),
        date: expect.any(String),
        distance: '10 km', // 10000m / 1000 = 10km
        ascent: '100 m',
      })
    })

    test('formats distance correctly', () => {
      popoverController.showPopover(track1.id, [0, 0])

      const callData = mockShowCallback.mock?.calls[0]?.[0]
      expect(callData?.distance).toBe('10 km')
    })
  })

  // -------------------------------------------------------------------------
  // Disposal
  // -------------------------------------------------------------------------
  describe('disposal', () => {
    test('disposes controller and cleans up resources', () => {
      const mockElement = document.createElement('div')
      const mockMap = { addOverlay: vi.fn() } as unknown as OlMap
      popoverController.initPopover(
        mockElement,
        mockShowCallback as PopoverShowCallback,
        mockDismissCallback as PopoverDismissCallback,
        mockMap
      )

      popoverController.dispose()

      expect(mockPopoverManager.dispose).toHaveBeenCalled()
      expect(popoverController.isPopoverActive()).toBe(false)
    })
  })
})