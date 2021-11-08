import { TrackVisibilityManager } from '../../src/lib/mapStateHelpers.js'

test('TrackVisibilityManager', () => {
  const currentlyVisible = [3, 5, 6, 7, 10]
  const toBeVisible = [1, 2, 3, 4, 10]

  // expected
  const deltaToBeEnabledIdList = new Set([1, 2, 4])
  const alreadyVisibleIds = new Set([3, 10])
  const toBeHidden = new Set([5, 6, 7])

  // eslint-disable-next-line no-unused-vars
  const tvm = new TrackVisibilityManager(currentlyVisible, toBeVisible)

  expect(tvm.deltaToBeEnabledIdList).toEqual(deltaToBeEnabledIdList)
  expect(tvm.alreadyVisibleIdList).toEqual(alreadyVisibleIds)
  expect(tvm.toBeHiddenIdList).toEqual(toBeHidden)
})
