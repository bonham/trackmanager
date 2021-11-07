import { TrackVisibilityManager } from '../../src/lib/mapStateHelpers.js'
// const assert = require('assert')

// describe('TVM', function () {
//   describe('#setToBeVisible', function () {
//     it('test1', function () {
//       assert.equal(1, 1)
//     })
//   })
// })

beforeEach(() => {
  window.URL.createObjectURL = jest.fn()
})

afterEach(() => {
  window.URL.createObjectURL.mockReset()
})

test('TrackVisibilityManager', () => {
  window.URL.createObjectURL = jest.fn()

  const currentlyVisible = [3, 5, 6, 7, 10]
  const toBeVisible = [1, 2, 3, 4, 10]
  const layerMap = {}

  // expected
  const notYetVisibleIds = new Set([1, 2, 4])
  const alreadyVisibleIds = new Set([3, 10])
  const toBeHidden = new Set([5, 6, 7])

  // eslint-disable-next-line no-unused-vars
  const tvm = new TrackVisibilityManager(currentlyVisible, layerMap)

  tvm.setToBeVisibleIds(toBeVisible)
  expect(tvm.notYetVisibleIdList).toEqual(notYetVisibleIds)
  expect(tvm.alreadyVisibleIdList).toEqual(alreadyVisibleIds)
  expect(tvm.toBeHiddenIdList).toEqual(toBeHidden)
})
