import { Map as OlMap } from 'ol'
import { transformExtent } from 'ol/proj'
import type { Extent } from 'ol/extent'
import { ExtentCollection } from './ExtentCollection'

/**
 * MapViewManager handles map view and extent operations.
 *
 * Responsibilities:
 * - Handles map view and extent operations
 * - Manages coordinate system transformations (EPSG:4326 ↔ EPSG:3857)
 * - Controls zoom animations and view fitting
 * - Calculates combined extents for multiple tracks
 */
export class MapViewManager {
  private map: OlMap

  constructor(map: OlMap) {
    this.map = map
  }

  /**
   * Set map view to fit a bounding box in EPSG:4326 (WGS84 GPS coordinates).
   * Automatically transforms to EPSG:3857 (Web Mercator) for OpenLayers.
   *
   * @param bbox - [minX, minY, maxX, maxY] extent in EPSG:4326
   */
  setMapViewBbox(bbox: Extent): void {
    const extent = transformExtent(
      bbox,
      'EPSG:4326',
      'EPSG:3857'
    )

    this.setMapView(extent)
  }

  /**
   * Set map view to fit an extent in EPSG:3857 (Web Mercator / OpenLayers native).
   *
   * @param extent - [minX, minY, maxX, maxY] in EPSG:3857
   */
  setMapView(extent: Extent): void {
    const mapSize = this.map.getSize()
    if (mapSize === undefined) {
      console.error("Map size is undefined")
      return
    }

    const view = this.map.getView()
    view.fit(extent, { size: mapSize })
  }

  /**
   * Get the current map view extent in EPSG:3857 (Web Mercator).
   *
   * @returns [minX, minY, maxX, maxY] extent in EPSG:3857
   */
  getMapViewExtent(): Extent {
    const extent = this.map.getView().calculateExtent(this.map.getSize())
    console.log(extent.join(', '))
    return extent
  }

  /**
   * Get the current map view as a bounding box in EPSG:4326 (WGS84 GPS coordinates).
   * Transforms from internal EPSG:3857 projection.
   *
   * @returns [minLon, minLat, maxLon, maxLat] bbox in EPSG:4326
   */
  getMapViewBbox(): Extent {
    const bbox = transformExtent(
      this.getMapViewExtent(),
      'EPSG:3857',
      'EPSG:4326'
    )
    return bbox
  }

  /**
   * Animate zoom out by a factor (default 0.97 = zoom to 97% of current level).
   *
   * @param scale - Zoom scale factor (default: 0.97). Values < 1 zoom out.
   */
  zoomOut(scale = 0.97): void {
    const view = this.map.getView()
    const zoomval = view.getZoom()
    if (zoomval === undefined) {
      console.error("Can not zoom")
      return
    }

    view.animate({ zoom: zoomval * scale })
  }

  /**
   * Animate zoom in by a factor (default 1.03 = zoom to 103% of current level).
   *
   * @param scale - Zoom scale factor (default: 1.03). Values > 1 zoom in.
   */
  zoomIn(scale = 1.03): void {
    const view = this.map.getView()
    const zoomval = view.getZoom()
    if (zoomval === undefined) {
      console.error("Can not zoom")
      return
    }

    view.animate({ zoom: zoomval * scale })
  }

  /**
   * Set map zoom to a specific level.
   *
   * @param zoom - Target zoom level
   * @param animate - Whether to animate the zoom transition (default: true)
   */
  setZoom(zoom: number, animate = true): void {
    const view = this.map.getView()

    if (animate) {
      view.animate({ zoom })
    } else {
      view.setZoom(zoom)
    }
  }

  /**
   * Get current zoom level.
   *
   * @returns Current zoom level or undefined if not available
   */
  getZoom(): number | undefined {
    return this.map.getView().getZoom()
  }

  /**
   * Set map center coordinates in EPSG:3857.
   *
   * @param center - [x, y] coordinates in EPSG:3857
   * @param animate - Whether to animate the pan transition (default: true)
   */
  setCenter(center: [number, number], animate = true): void {
    const view = this.map.getView()

    if (animate) {
      view.animate({ center })
    } else {
      view.setCenter(center)
    }
  }

  /**
   * Get current map center coordinates in EPSG:3857.
   *
   * @returns [x, y] coordinates in EPSG:3857 or undefined if not available
   */
  getCenter(): [number, number] | undefined {
    return this.map.getView().getCenter() as [number, number] | undefined
  }

  /**
   * Fit map view to multiple extents and apply zoom-out animation.
   * Calculates the overall bounding box from all provided extents.
   *
   * @param extents - Array of extents in EPSG:3857 to fit
   * @param zoomOutScale - Scale factor for zoom-out animation (default: 0.97)
   */
  fitToExtents(extents: Extent[], zoomOutScale = 0.97): void {
    const validExtents = extents.filter(extent => extent !== null && extent !== undefined)

    if (validExtents.length === 0) {
      console.log("No valid extents provided - no view change applied")
      return
    }

    try {
      const overallBbox = new ExtentCollection(validExtents).boundingBox()
      if (overallBbox) {
        this.setMapView(overallBbox)
        this.zoomOut(zoomOutScale)
      }
    } catch (error) {
      console.error("Failed to fit to extents:", error)
    }
  }

  /**
   * Fit map view to a single extent and apply zoom-out animation.
   *
   * @param extent - Extent in EPSG:3857 to fit
   * @param zoomOutScale - Scale factor for zoom-out animation (default: 0.97)
   */
  fitToExtent(extent: Extent, zoomOutScale = 0.97): void {
    this.fitToExtents([extent], zoomOutScale)
  }

  /**
   * Animate to a specific view configuration.
   *
   * @param options - Animation options
   */
  animateToView(options: {
    center?: [number, number]
    zoom?: number
    duration?: number
  }): void {
    const view = this.map.getView()
    const animationOptions: { center?: [number, number]; zoom?: number; duration?: number } = {}

    if (options.center) animationOptions.center = options.center
    if (options.zoom !== undefined) animationOptions.zoom = options.zoom
    if (options.duration !== undefined) animationOptions.duration = options.duration

    view.animate(animationOptions)
  }

  /**
   * Reset map view to a default state (center at [0, 0], zoom level 0).
   */
  resetView(): void {
    this.animateToView({
      center: [0, 0],
      zoom: 0,
      duration: 1000
    })
  }

  /**
   * Check if the map has a valid size (required for many view operations).
   *
   * @returns true if map has a valid size, false otherwise
   */
  hasValidSize(): boolean {
    const size = this.map.getSize()
    if (!size || size.length < 2) {
      return false
    }
    const [width, height] = size
    return (width ?? 0) > 0 && (height ?? 0) > 0
  }
}