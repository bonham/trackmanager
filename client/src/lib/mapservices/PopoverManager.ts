import Overlay from 'ol/Overlay.js'
import type { Coordinate } from 'ol/coordinate';

class PopoverManager {
  popupElement: HTMLElement
  popupOverlay: Overlay

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

}

export { PopoverManager }
