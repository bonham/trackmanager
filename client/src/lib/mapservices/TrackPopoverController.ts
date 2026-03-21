import type { Coordinate } from 'ol/coordinate'
import { Map as OlMap } from 'ol'
import { MapPopoverOverlay } from './MapPopoverOverlay'
import type { TrackLayerManager } from './TrackLayerManager'
import type { TrackSelectionManager } from './TrackSelectionManager'
import type { Track } from '@/lib/Track'

export interface PopoverData {
  trackId: number
  name: string
  date: string
  distance: string
  ascent: string | null
}

export type PopoverShowCallback = (data: PopoverData) => void
export type PopoverDismissCallback = () => void

interface TrackSelectionEvent extends CustomEvent {
  detail: {
    type: 'track-selected' | 'track-deselected' | 'selection-cleared'
    trackIds: number[]
    coordinate?: Coordinate
  }
}

/**
 * TrackPopoverController manages popover display and interaction.
 *
 * Responsibilities:
 * - Manages MapPopoverOverlay integration
 * - Formats track data for display
 * - Handles popover positioning and lifecycle
 * - Coordinates show/dismiss callbacks
 */
export class TrackPopoverController {
  private layerManager: TrackLayerManager
  private selectionManager: TrackSelectionManager
  private popoverManager: MapPopoverOverlay | null = null
  private onPopoverShow: PopoverShowCallback | null = null
  private onPopoverDismiss: PopoverDismissCallback | null = null

  constructor(layerManager: TrackLayerManager, selectionManager: TrackSelectionManager) {
    this.layerManager = layerManager
    this.selectionManager = selectionManager

    // Listen to selection events
    this.setupSelectionEventListeners()
  }

  /**
   * Initialize popover display with custom show/dismiss callbacks.
   * Enables draggable popup functionality on the map.
   *
   * @param popupElement - HTML element to use as popover container
   * @param onShow - Callback invoked when a track is selected and popover displays
   * @param onDismiss - Callback invoked when popover is closed
   */
  initPopover(
    popupElement: HTMLElement,
    onShow: PopoverShowCallback,
    onDismiss: PopoverDismissCallback,
    map: OlMap
  ): void {
    this.popoverManager = new MapPopoverOverlay(popupElement)
    this.popoverManager.initDrag(map)
    map.addOverlay(this.popoverManager.getOverlay())
    this.onPopoverShow = onShow
    this.onPopoverDismiss = onDismiss
  }

  /**
   * Display popover at the given coordinate with track information.
   * Triggers the onPopoverShow callback with formatted track data.
   *
   * @param trackId - ID of track to display in popover
   * @param coordinate - [x, y] coordinate for popover position in map projection
   */
  showPopover(trackId: number, coordinate: Coordinate): void {
    if (!this.popoverManager) {
      console.error("Not able to show popup. No popupmanager")
      return
    }

    const track = this.layerManager.getTrack(trackId)
    if (!track) {
      console.error(`Could not find track with id ${trackId}`)
      return
    }

    const popoverData = this.formatTrackData(track)
    this.popoverManager.setPosition(coordinate)
    this.onPopoverShow?.(popoverData)
  }

  /**
   * Close and clean up the current popover, triggering the dismiss callback.
   */
  disposePopover(): void {
    if (!this.popoverManager) {
      console.error("Not able to dispose popup. No popupmanager")
      return
    }

    this.popoverManager.dispose()
    this.onPopoverDismiss?.()
  }

  /**
   * Format track data for popover display.
   *
   * @param track - Track object to format
   * @returns PopoverData object with formatted track information
   */
  private formatTrackData(track: Track): PopoverData {
    const dateopts: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: '2-digit'
    }

    return {
      trackId: track.id,
      name: track.getNameOrSrc(),
      date: track.localeDateShort(dateopts),
      distance: `${(track.distance() / 1000).toFixed()} km`,
      ascent: track.getAscent() ? `${track.getAscent().toFixed()} m` : null,
    }
  }

  /**
   * Setup event listeners for selection changes to automatically show/hide popover.
   */
  private setupSelectionEventListeners(): void {
    this.selectionManager.addEventListener('selection-change', ((event: TrackSelectionEvent) => {
      const { type, trackIds, coordinate } = event.detail

      switch (type) {
        case 'track-selected':
          if (trackIds.length === 1 && coordinate) {
            this.showPopover(trackIds[0]!, coordinate)
          }
          break

        case 'selection-cleared':
          this.disposePopover()
          break

        case 'track-deselected':
          this.disposePopover()
          break

        default:
          console.warn(`Unknown selection event type`)
          break
      }
    }) as EventListener)
  }

  /**
   * Check if popover is initialized.
   *
   * @returns true if initPopover() has been called, false otherwise
   */
  isInitialized(): boolean {
    return this.popoverManager !== null
  }

  /**
   * Get the current popover position.
   *
   * @returns Current popover coordinate or null if not positioned
   */
  getPopoverPosition(): Coordinate | null {
    if (!this.popoverManager) {
      return null
    }

    return this.popoverManager.getOverlay().getPosition() ?? null
  }

  /**
   * Set popover position without showing track data (for manual positioning).
   *
   * @param coordinate - [x, y] coordinate for popover position
   */
  setPopoverPosition(coordinate: Coordinate): void {
    if (!this.popoverManager) {
      console.error("No popover manager available for positioning")
      return
    }

    this.popoverManager.setPosition(coordinate)
  }

  /**
   * Dispose of the popover controller and clean up resources.
   */
  dispose(): void {
    this.disposePopover()
    this.popoverManager = null
    this.onPopoverShow = null
    this.onPopoverDismiss = null
  }
}