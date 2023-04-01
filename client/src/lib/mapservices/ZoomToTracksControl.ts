import type { Options as ZoomOptions } from 'ol/control/Zoom'
import { Control } from 'ol/control'


interface ZoomToTracksControlOptions extends ZoomOptions {
  actionCallBack: (() => void)
}
export class ZoomToTracksControl extends Control {
  /**
   * @param {Object} [optOptions] Control options.
   */
  constructor(optOptions: ZoomToTracksControlOptions) {
    // options:
    //   actionsCallback
    const options = optOptions

    const button = document.createElement('button')
    // const svg = document.createElement('svg')

    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-fullscreen" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/></svg>'

    const element = document.createElement('div')
    element.className = 'map-control-expand ol-unselectable ol-control'
    element.appendChild(button)

    super({
      element,
      target: options.target
    })

    button.addEventListener('click', optOptions.actionCallBack, false)
  }
}
