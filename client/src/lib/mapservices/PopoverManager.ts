import Overlay from 'ol/Overlay.js'
import type { Coordinate } from 'ol/coordinate';
import { Popover } from 'bootstrap'

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
    const popover = Popover.getInstance(this.popupElement)
    if (popover) {
      popover.dispose();
    }
  }

  setNewPopover(coord: Coordinate, opts: {
    animation: boolean,
    content: string,
    placement: 'top',
    title: string,
  }) {

    // dismiss previous popup
    let popover = Popover.getInstance(this.popupElement)
    if (popover) {
      popover.dispose();
    }

    this.setPosition(coord)

    popover = new Popover(
      this.popupElement,
      {
        animation: opts.animation,
        container: this.popupElement,
        content: opts.content,
        html: true,
        placement: opts.placement,
        title: opts.title
      }
    )
    popover.show()

  }

}

export { PopoverManager }