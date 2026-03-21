import Overlay from 'ol/Overlay.js'
import type { Map as OlMap } from 'ol'
import type { Coordinate } from 'ol/coordinate';

/**
 * MapPopoverOverlay wraps an OpenLayers Overlay and manages drag-to-reposition interaction.
 *
 * Responsibilities:
 * - Creates and owns the OL Overlay attached to a popup HTML element
 * - Controls overlay position (show at coordinate / hide via dispose)
 * - Handles pointer-event-based dragging via a designated drag handle element
 *
 * No knowledge of tracks, application state, or Vue callbacks.
 */
class MapPopoverOverlay {
  private popupElement: HTMLElement
  popupOverlay: Overlay
  private map: OlMap | null = null
  private dragging = false
  private dragStartX = 0
  private dragStartY = 0

  constructor(popupelement: HTMLElement) {
    this.popupElement = popupelement

    this.popupOverlay = new Overlay({
      element: this.popupElement,
    })

  }

  getOverlay() {
    return this.popupOverlay
  }

  setPosition(coord: Coordinate) {
    this.popupOverlay.setPosition(coord)
  }

  dispose() {
    this.popupOverlay.setPosition(undefined)
  }

  initDrag(map: OlMap) {
    this.map = map

    this.popupElement.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.map-popover-drag-handle')) return

      this.dragging = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      target.closest('.map-popover-drag-handle')!.classList.add('grabbing')
      this.popupElement.setPointerCapture(e.pointerId)
      e.preventDefault()
    })

    this.popupElement.addEventListener('pointermove', (e) => {
      if (!this.dragging || !this.map) return

      const pos = this.popupOverlay.getPosition()
      if (!pos) return

      const currentPixel = this.map.getPixelFromCoordinate(pos)
      if (!currentPixel) return

      const dx = e.clientX - this.dragStartX
      const dy = e.clientY - this.dragStartY

      const newPixel: [number, number] = [currentPixel[0]! + dx, currentPixel[1]! + dy]
      const newCoord = this.map.getCoordinateFromPixel(newPixel)
      this.popupOverlay.setPosition(newCoord)

      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
    })

    this.popupElement.addEventListener('pointerup', (e) => {
      if (!this.dragging) return
      this.dragging = false
      const handle = this.popupElement.querySelector('.map-popover-drag-handle')
      handle?.classList.remove('grabbing')
      this.popupElement.releasePointerCapture(e.pointerId)
    })
  }

}

export { MapPopoverOverlay }
