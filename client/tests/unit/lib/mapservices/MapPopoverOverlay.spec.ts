import { vi, describe, test, beforeEach, expect } from 'vitest'
import { MapPopoverOverlay } from '@/lib/mapservices/MapPopoverOverlay'
import type { Map as OlMap } from 'ol'

// ---------------------------------------------------------------------------
// Mock ol/Overlay.js
// ---------------------------------------------------------------------------
const mockOlOverlay = vi.hoisted(() => ({
  setPosition: vi.fn(),
  setPositioning: vi.fn(),
  getPosition: vi.fn(),
}))

vi.mock('ol/Overlay.js', () => ({
  default: vi.fn(function (this: typeof mockOlOverlay) {
    this.setPosition = mockOlOverlay.setPosition
    this.setPositioning = mockOlOverlay.setPositioning
    this.getPosition = mockOlOverlay.getPosition
  }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MapPopoverOverlay', () => {
  let popupElement: HTMLElement
  let sut: MapPopoverOverlay
  let mockMap: {
    getPixelFromCoordinate: ReturnType<typeof vi.fn>
    getCoordinateFromPixel: ReturnType<typeof vi.fn>
    getSize: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    popupElement = document.createElement('div')
    popupElement.innerHTML = '<div class="map-popover-drag-handle"></div>'
    // jsdom doesn't implement pointer capture — stub both methods
    popupElement.setPointerCapture = vi.fn()
    popupElement.releasePointerCapture = vi.fn()

    sut = new MapPopoverOverlay(popupElement)

    mockMap = {
      getPixelFromCoordinate: vi.fn(),
      getCoordinateFromPixel: vi.fn((p: number[]) => p),
      getSize: vi.fn(() => [1000, 800]),
    }
  })

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    test('creates an OL Overlay configured with the provided element', async () => {
      const { default: Overlay } = await import('ol/Overlay.js')
      expect(vi.mocked(Overlay)).toHaveBeenCalledWith({ element: popupElement })
    })
  })

  // -------------------------------------------------------------------------
  // getOverlay
  // -------------------------------------------------------------------------
  describe('getOverlay', () => {
    test('returns the internal OL Overlay instance', () => {
      const overlay = sut.getOverlay()
      expect(overlay).toBeDefined()
      // Confirm it is the mocked instance by checking a known mock method
      expect(overlay.setPosition).toBe(mockOlOverlay.setPosition)
    })
  })

  // -------------------------------------------------------------------------
  // setPosition
  // -------------------------------------------------------------------------
  describe('setPosition', () => {
    test('delegates to overlay.setPosition with the given coordinate', () => {
      sut.setPosition([12, 34])
      expect(mockOlOverlay.setPosition).toHaveBeenCalledWith([12, 34])
    })
  })

  // -------------------------------------------------------------------------
  // dispose
  // -------------------------------------------------------------------------
  describe('dispose', () => {
    test('hides the overlay by calling setPosition(undefined)', () => {
      sut.dispose()
      expect(mockOlOverlay.setPosition).toHaveBeenCalledWith(undefined)
    })
  })

  // -------------------------------------------------------------------------
  // initDrag
  // -------------------------------------------------------------------------
  describe('initDrag', () => {
    beforeEach(() => {
      sut.initDrag(mockMap as unknown as OlMap)
    })

    function getDragHandle(): Element {
      return popupElement.querySelector('.map-popover-drag-handle')!
    }

    function startDrag(clientX = 0, clientY = 0, pointerId = 1) {
      getDragHandle().dispatchEvent(
        new PointerEvent('pointerdown', { clientX, clientY, pointerId, bubbles: true, cancelable: true }),
      )
    }

    // -----------------------------------------------------------------------
    // pointerdown
    // -----------------------------------------------------------------------
    describe('pointerdown on drag handle', () => {
      test('adds "grabbing" class to the handle', () => {
        startDrag()
        expect(getDragHandle().classList.contains('grabbing')).toBe(true)
      })

      test('captures the pointer on the popup element', () => {
        startDrag(0, 0, 7)
        expect(popupElement.setPointerCapture).toHaveBeenCalledWith(7)
      })

      test('records the initial client position', () => {
        // Verify via the first pointermove producing the correct delta
        mockOlOverlay.getPosition.mockReturnValue([0, 0])
        mockMap.getPixelFromCoordinate.mockReturnValue([50, 50])

        startDrag(10, 20)
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 20, clientY: 30, bubbles: true }),
        )

        // dx=10, dy=10 → newPixel=[60,60]
        expect(mockMap.getCoordinateFromPixel).toHaveBeenCalledWith([60, 60])
      })
    })

    describe('pointerdown outside a drag handle', () => {
      test('does not start dragging', () => {
        // Dispatch directly on popupElement, which has no drag-handle class
        popupElement.dispatchEvent(
          new PointerEvent('pointerdown', { clientX: 10, clientY: 20, pointerId: 1, bubbles: false }),
        )

        // Verify dragging did not start: pointermove should not move the overlay
        mockOlOverlay.getPosition.mockReturnValue([0, 0])
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 50, clientY: 60, bubbles: true }),
        )

        expect(mockOlOverlay.setPosition).not.toHaveBeenCalled()
        expect(popupElement.setPointerCapture).not.toHaveBeenCalled()
      })
    })

    // -----------------------------------------------------------------------
    // pointermove
    // -----------------------------------------------------------------------
    describe('pointermove', () => {
      test('moves the overlay by the pointer delta', () => {
        mockOlOverlay.getPosition.mockReturnValue([100, 200])
        mockMap.getPixelFromCoordinate.mockReturnValue([100, 200])

        startDrag(10, 20)
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 30, clientY: 50, bubbles: true }),
        )

        // dx=20, dy=30 → newPixel=[120,230]
        expect(mockMap.getCoordinateFromPixel).toHaveBeenCalledWith([120, 230])
        expect(mockOlOverlay.setPosition).toHaveBeenCalledWith([120, 230])
      })

      test('updates drag start position on each move (incremental deltas)', () => {
        mockOlOverlay.getPosition.mockReturnValue([0, 0])
        mockMap.getPixelFromCoordinate.mockReturnValue([0, 0])

        startDrag(0, 0)

        // First move — delta (10, 10)
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 10, clientY: 10, bubbles: true }),
        )
        // Second move from (10,10) — delta (5, 5), not (15, 15) from origin
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 15, clientY: 15, bubbles: true }),
        )

        expect(mockMap.getCoordinateFromPixel).toHaveBeenNthCalledWith(1, [10, 10])
        expect(mockMap.getCoordinateFromPixel).toHaveBeenNthCalledWith(2, [5, 5])
      })

      test('does nothing when not dragging', () => {
        mockOlOverlay.getPosition.mockReturnValue([0, 0])
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 50, clientY: 60, bubbles: true }),
        )
        expect(mockOlOverlay.setPosition).not.toHaveBeenCalled()
      })

      test('does nothing when overlay has no current position', () => {
        mockOlOverlay.getPosition.mockReturnValue(undefined)
        startDrag()
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 20, clientY: 30, bubbles: true }),
        )
        expect(mockOlOverlay.setPosition).not.toHaveBeenCalled()
      })

      test('does nothing when map cannot convert coordinate to pixel', () => {
        mockOlOverlay.getPosition.mockReturnValue([100, 200])
        mockMap.getPixelFromCoordinate.mockReturnValue(null)
        startDrag()
        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 20, clientY: 30, bubbles: true }),
        )
        expect(mockOlOverlay.setPosition).not.toHaveBeenCalled()
      })
    })

    // -----------------------------------------------------------------------
    // pointerup
    // -----------------------------------------------------------------------
    describe('pointerup', () => {
      test('removes "grabbing" class from the handle', () => {
        startDrag(0, 0, 3)
        expect(getDragHandle().classList.contains('grabbing')).toBe(true)

        popupElement.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, bubbles: true }))

        expect(getDragHandle().classList.contains('grabbing')).toBe(false)
      })

      test('releases pointer capture', () => {
        startDrag(0, 0, 3)
        popupElement.dispatchEvent(new PointerEvent('pointerup', { pointerId: 3, bubbles: true }))
        expect(popupElement.releasePointerCapture).toHaveBeenCalledWith(3)
      })

      test('stops dragging so subsequent pointermove events are ignored', () => {
        mockOlOverlay.getPosition.mockReturnValue([0, 0])
        mockMap.getPixelFromCoordinate.mockReturnValue([0, 0])

        startDrag()
        popupElement.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }))

        popupElement.dispatchEvent(
          new PointerEvent('pointermove', { clientX: 50, clientY: 60, bubbles: true }),
        )
        expect(mockOlOverlay.setPosition).not.toHaveBeenCalled()
      })

      test('does nothing when not currently dragging', () => {
        popupElement.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true }))
        expect(popupElement.releasePointerCapture).not.toHaveBeenCalled()
      })
    })
  })

  // -------------------------------------------------------------------------
  // Smart positioning
  // -------------------------------------------------------------------------
  describe('smart positioning', () => {
    test('uses top-left when click is far from edges', () => {
      sut.initDrag(mockMap as unknown as OlMap)
      // map is 1000x800, click at pixel 100,100 — far from edges
      mockMap.getPixelFromCoordinate.mockReturnValue([100, 100])

      sut.setPosition([500, 500])

      expect(mockOlOverlay.setPositioning).toHaveBeenCalledWith('top-left')
    })

    test('uses top-right when click is near right edge', () => {
      sut.initDrag(mockMap as unknown as OlMap)
      // pixel x=800, within 250px of right edge (1000)
      mockMap.getPixelFromCoordinate.mockReturnValue([800, 100])

      sut.setPosition([500, 500])

      expect(mockOlOverlay.setPositioning).toHaveBeenCalledWith('top-right')
    })

    test('uses bottom-left when click is near bottom edge', () => {
      sut.initDrag(mockMap as unknown as OlMap)
      // pixel y=650, within 200px of bottom edge (800)
      mockMap.getPixelFromCoordinate.mockReturnValue([100, 650])

      sut.setPosition([500, 500])

      expect(mockOlOverlay.setPositioning).toHaveBeenCalledWith('bottom-left')
    })

    test('uses bottom-right when click is near bottom-right corner', () => {
      sut.initDrag(mockMap as unknown as OlMap)
      mockMap.getPixelFromCoordinate.mockReturnValue([800, 650])

      sut.setPosition([500, 500])

      expect(mockOlOverlay.setPositioning).toHaveBeenCalledWith('bottom-right')
    })

    test('defaults to top-left when map is not initialized', () => {
      // no initDrag called — map is null
      sut.setPosition([500, 500])

      expect(mockOlOverlay.setPositioning).toHaveBeenCalledWith('top-left')
    })
  })
})
