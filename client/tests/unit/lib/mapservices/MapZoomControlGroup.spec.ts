import { vi, describe, test, beforeEach, expect } from 'vitest'
import { MapZoomControlGroup } from '@/lib/mapservices/MapZoomControlGroup'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Access the protected OL Control.element without casting in every test */
function getElement(control: MapZoomControlGroup): HTMLElement {
  return (control as unknown as { element: HTMLElement }).element
}

/** Grab buttons by title so tests are independent of button order */
function getButton(control: MapZoomControlGroup, title: string): HTMLButtonElement {
  const btn = getElement(control).querySelector<HTMLButtonElement>(`button[title="${title}"]`)
  if (!btn) throw new Error(`Button with title "${title}" not found`)
  return btn
}

/** Inject a minimal map-like object so click handlers can resolve getMap() */
function injectMapMock(control: MapZoomControlGroup, currentZoom: number) {
  const mockView = {
    getZoom: vi.fn(() => currentZoom),
    setZoom: vi.fn(),
  }
  const mockMap = { getView: vi.fn(() => mockView) }
    // Bypass setMap() side-effects by setting the private reference directly
    ; (control as unknown as Record<string, unknown>).map_ = mockMap
  return { mockView, mockMap }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapZoomControlGroup', () => {
  let control: MapZoomControlGroup
  let mockCallbackSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCallbackSpy = vi.fn()
    control = new MapZoomControlGroup({ zoomToTracksCallback: mockCallbackSpy as () => void })
  })

  // -------------------------------------------------------------------------
  // DOM structure
  // -------------------------------------------------------------------------

  describe('DOM structure', () => {
    test('container has map-zoom-control-group, ol-control and ol-unselectable CSS classes', () => {
      const el = getElement(control)
      expect(el.classList.contains('map-zoom-control-group')).toBe(true)
      expect(el.classList.contains('ol-control')).toBe(true)
      expect(el.classList.contains('ol-unselectable')).toBe(true)
    })

    test('container holds exactly 3 buttons', () => {
      expect(getElement(control).querySelectorAll('button')).toHaveLength(3)
    })

    test('contains a button with title "Zoom in"', () => {
      expect(getButton(control, 'Zoom in')).toBeInstanceOf(HTMLButtonElement)
    })

    test('contains a button with title "Zoom out"', () => {
      expect(getButton(control, 'Zoom out')).toBeInstanceOf(HTMLButtonElement)
    })

    test('contains a button with title "Zoom to tracks"', () => {
      expect(getButton(control, 'Zoom to tracks')).toBeInstanceOf(HTMLButtonElement)
    })
  })

  // -------------------------------------------------------------------------
  // Zoom-in button
  // -------------------------------------------------------------------------

  describe('zoom-in button', () => {
    test('increases view zoom by 1', () => {
      const { mockView } = injectMapMock(control, 5)
      getButton(control, 'Zoom in').dispatchEvent(new MouseEvent('click'))
      expect(mockView.setZoom).toHaveBeenCalledWith(6)
    })

    test('does not throw when no map is set', () => {
      expect(() =>
        getButton(control, 'Zoom in').dispatchEvent(new MouseEvent('click')),
      ).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // Zoom-out button
  // -------------------------------------------------------------------------

  describe('zoom-out button', () => {
    test('decreases view zoom by 1', () => {
      const { mockView } = injectMapMock(control, 5)
      getButton(control, 'Zoom out').dispatchEvent(new MouseEvent('click'))
      expect(mockView.setZoom).toHaveBeenCalledWith(4)
    })

    test('does not throw when no map is set', () => {
      expect(() =>
        getButton(control, 'Zoom out').dispatchEvent(new MouseEvent('click')),
      ).not.toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // Zoom-to-tracks button
  // -------------------------------------------------------------------------

  describe('zoom-to-tracks button', () => {
    test('calls the provided callback', () => {
      getButton(control, 'Zoom to tracks').dispatchEvent(new MouseEvent('click'))
      expect(mockCallbackSpy).toHaveBeenCalledOnce()
    })

    test('calls the callback again on each subsequent click', () => {
      const btn = getButton(control, 'Zoom to tracks')
      btn.dispatchEvent(new MouseEvent('click'))
      btn.dispatchEvent(new MouseEvent('click'))
      expect(mockCallbackSpy).toHaveBeenCalledTimes(2)
    })
  })
})
