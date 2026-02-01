import _ from 'lodash'

type TrackIdList = number[]

/**
 * This Class is calculating actions
 * 
 * There are 3 current states:
 * - a track is not loaded
 * - a track is loaded but not visible
 * - a track is loaded and visible
 * 
 * The to be state is: toBeVisible
 * 
 * The class calculates
 * - how many tracks are not loaded and need to be loaded and set visible
 * - how many tracks are visible and should stay visible
 * - how many tracks are loaded and not visible and should stay invisible
 * - how many tracks are loaded and visible and should be set invisible
 * - how many tracks are loaded and invisible and should be set visible
 *  
 */
class TrackVisibilityManager {
  currentlyVisible: TrackIdList
  toBeVisible: TrackIdList
  alreadyLoaded: TrackIdList

  /**
   * Create instance of TrackVisibilityManager 
   * 
   * @param currentlyVisible 
   * @param toBeVisible 
   * @param alreadyLoaded 
   */
  constructor(currentlyVisible: TrackIdList, toBeVisible: TrackIdList, alreadyLoaded: TrackIdList) {
    this.currentlyVisible = _.uniq(currentlyVisible)
    this.toBeVisible = _.uniq(toBeVisible)
    this.alreadyLoaded = _.uniq(alreadyLoaded)
  }


  /**
   * Provides ids which need to be enabled, regardless if loaded or not
   * @returns List of numbers
   */
  deltaToBeEnabled() {
    return _.difference(this.toBeVisible, this.currentlyVisible)
  }

  /**
   * Provides ids which should be loaded and are already visible
   * @returns List of numbers
   */
  alreadyVisible() {
    return _.intersection(this.toBeVisible, this.currentlyVisible)
  }

  /**
   * Provides ids which are visible and should be toggled invisible.
   * @returns List of numbers
   */
  toBeHidden() {
    return _.difference(this.currentlyVisible, this.toBeVisible)
  }


  /**
   * Calculates list of ids which need to be loaded and added
   * @returns List of numbers
   */
  toBeLoaded() {
    return _.difference(this.deltaToBeEnabled(), this.alreadyLoaded)
  }

  /**
   * Provides list of id's  which are loaded but need to be toggled to be visible
   * @returns List of numbers
   */
  toggleToVisible() {
    return _.intersection(this.deltaToBeEnabled(), this.alreadyLoaded)
  }

  // ids which are loaded but do not need a toggle because they are already at the desired target state
  loadedButDoNotToggle() {
    const loadedVisibleShouldStay = _.intersection(this.currentlyVisible, this.toBeVisible, this.alreadyLoaded)

    // loaded and invisible and should be invisible

    const loadedInvisible = _.difference(this.alreadyLoaded, this.currentlyVisible)
    const loadedInvisibleShouldStay = _.difference(loadedInvisible, this.toBeVisible)

    return _.union(loadedVisibleShouldStay, loadedInvisibleShouldStay)
  }
}
export { TrackVisibilityManager }
