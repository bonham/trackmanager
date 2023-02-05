import { describe, test, beforeEach } from 'vitest'
import { ManagedMap, GeoJsonCollection, ExtentCollection } from '@/lib/mapServices'
const _ = require('lodash')

let mm
let gList1
let gList2
let gList3
let bboxexpectedg1g2
let bboxexpectedg1g3
let bbox1, bbox2, bbox3

const geojson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [
            -4.103736877441406,
            56.24163292831188
          ],
          [
            -4.0704345703125,
            56.22484046826683
          ]
        ]
      }
    }
  ]
}

beforeEach(() => {
  mm = new ManagedMap({ selectCallBackFn: (e) => { console.log('callback', e) } })
  bbox1 = [-20, -10.1, 40, 80]
  bbox2 = [-23, -11, -5, 70]
  bbox3 = [-30, 15, -28, 16]
  const g1 = geojson
  const g2 = _.cloneDeep(geojson)
  const g3 = _.cloneDeep(geojson)
  g1.bbox = bbox1
  gList1 = { id: 1, geojson: g1 }
  g2.bbox = bbox2
  gList2 = { id: 2, geojson: g2 }
  g3.bbox = bbox3
  gList3 = { id: 3, geojson: g3 }
  bboxexpectedg1g2 = [-23, -11, 40, 80]
  bboxexpectedg1g3 = [-30, -10.1, 40, 80]
})

test('Simple', () => {
  expect(mm.map).toBeDefined()
})

test('Add layer', () => {
  mm = new ManagedMap()
  mm.addTrackLayer({ id: 8, geojson })
  mm.addTrackLayer({ id: 9, geojson })
  expect(mm.getTrackIds()).toEqual([8, 9])
  // eslint-disable-next-line no-unused-vars
  const l9 = mm.getTrackLayer(9)
  mm.setInvisible(9)
  expect(mm.getTrackIdsVisible()).toEqual([8])
  expect(mm.getTrackIdsInVisible()).toEqual([9])
})

test('createLayer-getextent', () => {
  mm = new ManagedMap()
  mm.addTrackLayer({ id: 8, geojson })
  const layer = mm.getTrackLayer(8)
  const source = layer.getSource()
  expect(source).not.toBeNull()
})

describe('geojson collection and bounding box', () => {
  test('extent collection 1 2', () => {
    const ec = new ExtentCollection([bbox1, bbox2])
    expect(ec.boundingBox()).toEqual(bboxexpectedg1g2)
  })
  test('extent collection 1 3', () => {
    const ec = new ExtentCollection([bbox1, bbox3])
    expect(ec.boundingBox()).toEqual(bboxexpectedg1g3)
  })
  test('extent collection empty lilst', () => {
    const ec = new ExtentCollection([])
    expect(ec.boundingBox()).toBeNull()
  })
  test('geojson collection 1 2', () => {
    const gjc = new GeoJsonCollection([gList1, gList2])
    expect(gjc.boundingBox()).toEqual(bboxexpectedg1g2)
  })
  test('geojson collection 1 3', () => {
    const gjc = new GeoJsonCollection([gList1, gList3])
    expect(gjc.boundingBox()).toEqual(bboxexpectedg1g3)
  })
})
