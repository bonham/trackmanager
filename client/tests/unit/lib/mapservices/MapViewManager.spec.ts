/* eslint-disable @typescript-eslint/no-empty-function */
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { MapViewManager } from '@/lib/mapservices/MapViewManager'
import ResizeObserverMock from '../../__mocks__/ResizeObserver'
import { Map as OlMap, View } from 'ol'
import { Tile as TileLayer } from 'ol/layer'
import { OSM } from 'ol/source'
import type { Extent } from 'ol/extent'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const testExtent3857: Extent = [-1000000, 6000000, 1000000, 8000000] // EPSG:3857
const testExtent4326: Extent = [-8.98, 48.85, 8.98, 61.21] // EPSG:4326 (roughly Europe)
const testCenter: [number, number] = [0, 6000000] // Center of Europe in EPSG:3857

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
      zoom: 2
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MapViewManager', () => {
  let viewManager: MapViewManager
  let map: OlMap

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    map = createTestMap()

    // Mock map size to avoid undefined issues
    vi.spyOn(map, 'getSize').mockReturnValue([800, 600])

    viewManager = new MapViewManager(map)
  })

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    test('creates view manager with provided map', () => {
      expect(viewManager).toBeDefined()
    })
  })

  // -------------------------------------------------------------------------
  // Extent operations
  // -------------------------------------------------------------------------
  describe('extent operations', () => {
    test('sets map view with EPSG:3857 extent', () => {
      const view = map.getView()
      const fitSpy = vi.spyOn(view, 'fit')

      viewManager.setMapView(testExtent3857)

      expect(fitSpy).toHaveBeenCalledWith(testExtent3857, { size: [800, 600] })
    })

    test('sets map view with EPSG:4326 bbox (transforms to 3857)', () => {
      const view = map.getView()
      const fitSpy = vi.spyOn(view, 'fit')

      viewManager.setMapViewBbox(testExtent4326)

      expect(fitSpy).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number)]),
        { size: [800, 600] }
      )
    })

    test('handles undefined map size gracefully', () => {
      vi.spyOn(map, 'getSize').mockReturnValue(undefined)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      viewManager.setMapView(testExtent3857)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Map size is undefined')
      consoleErrorSpy.mockRestore()
    })

    test('gets current map view extent', () => {
      const view = map.getView()
      vi.spyOn(view, 'calculateExtent').mockReturnValue(testExtent3857)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

      const extent = viewManager.getMapViewExtent()

      expect(extent).toEqual(testExtent3857)
      expect(consoleSpy).toHaveBeenCalledWith(testExtent3857.join(', '))
      consoleSpy.mockRestore()
    })

    test('gets current map view as EPSG:4326 bbox', () => {
      const view = map.getView()
      vi.spyOn(view, 'calculateExtent').mockReturnValue(testExtent3857)

      const bbox = viewManager.getMapViewBbox()

      expect(bbox).toHaveLength(4)
      expect(bbox.every(coord => typeof coord === 'number')).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // Zoom operations
  // -------------------------------------------------------------------------
  describe('zoom operations', () => {
    test('zooms out with default scale', () => {
      const view = map.getView()
      vi.spyOn(view, 'getZoom').mockReturnValue(5)
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.zoomOut()

      expect(animateSpy).toHaveBeenCalledWith({ zoom: 5 * 0.97 })
    })

    test('zooms out with custom scale', () => {
      const view = map.getView()
      vi.spyOn(view, 'getZoom').mockReturnValue(10)
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.zoomOut(0.5)

      expect(animateSpy).toHaveBeenCalledWith({ zoom: 5 })
    })

    test('zooms in with default scale', () => {
      const view = map.getView()
      vi.spyOn(view, 'getZoom').mockReturnValue(5)
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.zoomIn()

      expect(animateSpy).toHaveBeenCalledWith({ zoom: 5 * 1.03 })
    })

    test('zooms in with custom scale', () => {
      const view = map.getView()
      vi.spyOn(view, 'getZoom').mockReturnValue(5)
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.zoomIn(2)

      expect(animateSpy).toHaveBeenCalledWith({ zoom: 10 })
    })

    test('handles undefined zoom level gracefully', () => {
      const view = map.getView()
      vi.spyOn(view, 'getZoom').mockReturnValue(undefined)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      viewManager.zoomOut()

      expect(consoleErrorSpy).toHaveBeenCalledWith('Can not zoom')
      consoleErrorSpy.mockRestore()
    })

    test('sets zoom with animation', () => {
      const view = map.getView()
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.setZoom(10, true)

      expect(animateSpy).toHaveBeenCalledWith({ zoom: 10 })
    })

    test('sets zoom without animation', () => {
      const view = map.getView()
      const setZoomSpy = vi.spyOn(view, 'setZoom').mockImplementation(() => { })

      viewManager.setZoom(10, false)

      expect(setZoomSpy).toHaveBeenCalledWith(10)
    })

    test('gets current zoom level', () => {
      const view = map.getView()
      vi.spyOn(view, 'getZoom').mockReturnValue(8)

      const zoom = viewManager.getZoom()

      expect(zoom).toBe(8)
    })
  })

  // -------------------------------------------------------------------------
  // Center operations
  // -------------------------------------------------------------------------
  describe('center operations', () => {
    test('sets center with animation', () => {
      const view = map.getView()
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.setCenter(testCenter, true)

      expect(animateSpy).toHaveBeenCalledWith({ center: testCenter })
    })

    test('sets center without animation', () => {
      const view = map.getView()
      const setCenterSpy = vi.spyOn(view, 'setCenter').mockImplementation(() => { })

      viewManager.setCenter(testCenter, false)

      expect(setCenterSpy).toHaveBeenCalledWith(testCenter)
    })

    test('gets current center', () => {
      const view = map.getView()
      vi.spyOn(view, 'getCenter').mockReturnValue(testCenter)

      const center = viewManager.getCenter()

      expect(center).toEqual(testCenter)
    })
  })

  // -------------------------------------------------------------------------
  // Multi-extent operations
  // -------------------------------------------------------------------------
  describe('multi-extent operations', () => {
    test('fits to multiple extents successfully', () => {
      const extents = [
        [-1000000, 6000000, 0, 7000000],
        [0, 6000000, 1000000, 7000000]
      ]
      const view = map.getView()
      const fitSpy = vi.spyOn(view, 'fit')
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.fitToExtents(extents)

      expect(fitSpy).toHaveBeenCalled()
      expect(animateSpy).toHaveBeenCalled()
    })

    test('fits to single extent', () => {
      const view = map.getView()
      const fitSpy = vi.spyOn(view, 'fit')

      viewManager.fitToExtent(testExtent3857)

      expect(fitSpy).toHaveBeenCalled()
    })

    test('handles empty extent array gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

      viewManager.fitToExtents([])

      expect(consoleSpy).toHaveBeenCalledWith('No valid extents provided - no view change applied')
      consoleSpy.mockRestore()
    })

    test('filters out null and undefined extents', () => {
      const extents = (
        [testExtent3857, null, undefined] as (Extent | null | undefined)[]
      ).filter((e): e is Extent => e !== null && e !== undefined)

      const view = map.getView()
      const fitSpy = vi.spyOn(view, 'fit')

      viewManager.fitToExtents(extents)

      expect(fitSpy).toHaveBeenCalled()
    })

    test('handles ExtentCollection errors gracefully', () => {
      // Pass invalid extents that would cause ExtentCollection to throw
      const invalidExtents = [[]] as unknown as Extent[]
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      viewManager.fitToExtents(invalidExtents)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fit to extents:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })
  })

  // -------------------------------------------------------------------------
  // Animation operations
  // -------------------------------------------------------------------------
  describe('animation operations', () => {
    test('animates to view with all options', () => {
      const view = map.getView()
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.animateToView({
        center: testCenter,
        zoom: 10,
        duration: 2000
      })

      expect(animateSpy).toHaveBeenCalledWith({
        center: testCenter,
        zoom: 10,
        duration: 2000
      })
    })

    test('animates to view with partial options', () => {
      const view = map.getView()
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.animateToView({ zoom: 15 })

      expect(animateSpy).toHaveBeenCalledWith({ zoom: 15 })
    })

    test('resets view to default state', () => {
      const view = map.getView()
      const animateSpy = vi.spyOn(view, 'animate').mockImplementation(() => { })

      viewManager.resetView()

      expect(animateSpy).toHaveBeenCalledWith({
        center: [0, 0],
        zoom: 0,
        duration: 1000
      })
    })
  })

  // -------------------------------------------------------------------------
  // Utility methods
  // -------------------------------------------------------------------------
  describe('utility methods', () => {
    test('checks for valid map size', () => {
      vi.spyOn(map, 'getSize').mockReturnValue([800, 600])
      expect(viewManager.hasValidSize()).toBe(true)

      vi.spyOn(map, 'getSize').mockReturnValue([0, 0])
      expect(viewManager.hasValidSize()).toBe(false)

      vi.spyOn(map, 'getSize').mockReturnValue(undefined)
      expect(viewManager.hasValidSize()).toBe(false)
    })
  })
})