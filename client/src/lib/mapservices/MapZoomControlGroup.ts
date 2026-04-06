import { Control } from 'ol/control'

interface Options {
  zoomToTracksCallback: () => void
}

/**
 * A single OpenLayers control that groups zoom-in, zoom-out, and zoom-to-tracks
 * buttons in one flex-column container.  All three buttons share the same
 * parent element so alignment is handled by the browser layout engine rather
 * than by hard-coded CSS top/left offsets.
 */
export class MapZoomControlGroup extends Control {
  constructor(options: Options) {
    const container = document.createElement('div')
    container.className = 'map-zoom-control-group ol-unselectable ol-control'

    const zoomInButton = document.createElement('button')
    zoomInButton.innerHTML = '+'
    zoomInButton.type = 'button'
    zoomInButton.title = 'Zoom in'

    const zoomOutButton = document.createElement('button')
    zoomOutButton.innerHTML = '&#8722;' // proper minus sign (−)
    zoomOutButton.type = 'button'
    zoomOutButton.title = 'Zoom out'

    const zoomToTracksButton = document.createElement('button')
    zoomToTracksButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">' +
      '<path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4z' +
      'M10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5z' +
      'M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5z' +
      'm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>' +
      '</svg>'
    zoomToTracksButton.type = 'button'
    zoomToTracksButton.title = 'Zoom to tracks'

    container.appendChild(zoomInButton)
    container.appendChild(zoomOutButton)
    container.appendChild(zoomToTracksButton)

    super({ element: container })

    zoomInButton.addEventListener('click', () => {
      const view = this.getMap()?.getView()
      const zoom = view?.getZoom()
      if (view !== undefined && zoom !== undefined) {
        view.setZoom(zoom + 1)
      }
    })

    zoomOutButton.addEventListener('click', () => {
      const view = this.getMap()?.getView()
      const zoom = view?.getZoom()
      if (view !== undefined && zoom !== undefined) {
        view.setZoom(zoom - 1)
      }
    })

    zoomToTracksButton.addEventListener('click', options.zoomToTracksCallback)
  }
}
