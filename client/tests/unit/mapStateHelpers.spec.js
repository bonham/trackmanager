import { TrackVisibilityManager } from '../../src/lib/mapStateHelpers.js'

test('TrackVisibilityManager', () => {
  const currentlyVisible = [3, 5, 6, 7, 10]
  const toBeVisible = [1, 2, 3, 4, 10]
  const alreadyLoaded = [1, 3, 4, 5, 6, 7, 10, 12]

  // expected
  const deltaToBeEnabled = [1, 2, 4]
  const alreadyVisible = [3, 10]
  const toBeHidden = [5, 6, 7]
  const toggleToVisible = [1, 4]
  const toBeLoaded = [2]
  const loadedButDoNotToggle = [3, 10, 12]

  // eslint-disable-next-line no-unused-vars
  const tvm = new TrackVisibilityManager(currentlyVisible, toBeVisible, alreadyLoaded)

  expect(tvm.deltaToBeEnabled()).toEqual(deltaToBeEnabled)
  expect(tvm.alreadyVisible()).toEqual(alreadyVisible)
  expect(tvm.toBeHidden()).toEqual(toBeHidden)
  expect(tvm.toggleToVisible()).toEqual(toggleToVisible)
  expect(tvm.toBeLoaded()).toEqual(toBeLoaded)
  expect(tvm.loadedButDoNotToggle()).toEqual(loadedButDoNotToggle)
})
