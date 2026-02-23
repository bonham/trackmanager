import { describe, test, expect } from 'vitest'
import _ from 'lodash'
import type { MultiLineString, BBox } from 'geojson'
import { ExtentCollection } from '@/lib/mapservices/ExtentCollection'
import { GeoJsonCollection } from '@/lib/mapservices/GeoJsonCollection'

const multilinestring: MultiLineString = {
  type: 'MultiLineString',
  coordinates: [[
    [
      -4.103736877441406,
      56.24163292831188
    ],
    [
      -4.0704345703125,
      56.22484046826683
    ]
  ]]
}

describe('geojson collection and bounding box', () => {

  const bbox1: BBox = [-20, -10.1, 40, 80]
  const bbox2: BBox = [-23, -11, -5, 70]
  const bbox3: BBox = [-30, 15, -28, 16]
  const g1 = multilinestring
  const g2 = _.cloneDeep(multilinestring)
  const g3 = _.cloneDeep(multilinestring)
  g1.bbox = bbox1
  const gList1 = { id: 1, geojson: g1 }
  g2.bbox = bbox2
  const gList2 = { id: 2, geojson: g2 }
  g3.bbox = bbox3
  const gList3 = { id: 3, geojson: g3 }
  const bboxexpectedg1g2 = [-23, -11, 40, 80]
  const bboxexpectedg1g3 = [-30, -10.1, 40, 80]
  test('extent collection 1 2', () => {
    const ec = new ExtentCollection([bbox1, bbox2])
    expect(ec.boundingBox()).toEqual(bboxexpectedg1g2)
  })
  test('extent collection 1 3', () => {
    const ec = new ExtentCollection([bbox1, bbox3])
    expect(ec.boundingBox()).toEqual(bboxexpectedg1g3)
  })
  test('extent collection empty list', () => {
    expect(() => { new ExtentCollection([]) }).toThrow()
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

