import _ from 'lodash'

class TrackVisibilityManager {
  constructor (currentlyVisible, toBeVisible, alreadyLoaded) {
    this.currentlyVisible = _.uniq(currentlyVisible)
    this.toBeVisible = _.uniq(toBeVisible)
    this.alreadyLoaded = _.uniq(alreadyLoaded)
  }

  // ids which need to be enabled, regardless if loaded or not
  deltaToBeEnabled () {
    return _.difference(this.toBeVisible, this.currentlyVisible)
  }

  // ids which should be loaded and are already visible
  alreadyVisible () {
    return _.intersection(this.toBeVisible, this.currentlyVisible)
  }

  // ids which are visible and should not be in future
  toBeHidden () {
    return _.difference(this.currentlyVisible, this.toBeVisible)
  }

  // ids which need to be enabled and should be loaded
  toBeLoaded () {
    return _.difference(this.deltaToBeEnabled(), this.alreadyLoaded)
  }

  // ids which need to be enabled and are already loaded
  toggleToVisible () {
    return _.intersection(this.deltaToBeEnabled(), this.alreadyLoaded)
  }

  // ids which are loaded but do not need a toggle because they are already at the desired target state
  loadedButDoNotToggle () {
    const loadedVisibleShouldStay = _.intersection(this.currentlyVisible, this.toBeVisible, this.alreadyLoaded)

    // loaded and invisible and should be invisible

    const loadedInvisible = _.difference(this.alreadyLoaded, this.currentlyVisible)
    const loadedInvisibleShouldStay = _.difference(loadedInvisible, this.toBeVisible)

    return _.union(loadedVisibleShouldStay, loadedInvisibleShouldStay)
  }
}
export { TrackVisibilityManager }
