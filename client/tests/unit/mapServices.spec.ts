import { vi } from 'vitest'
import { describe, test, beforeEach, expect } from 'vitest'
import { ManagedMap } from '@/lib/mapservices/ManagedMap'
import { GeoJsonCollection } from '@/lib/mapservices/GeoJsonCollection'
import { ExtentCollection } from '@/lib/mapservices/ExtentCollection'
import _ from 'lodash'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { Track } from '@/lib/Track'
import type { TrackInitData } from '@/lib/Track'
import type { GeoJSON, GeoJsonObject, BBox } from 'geojson'
import type { GeoJSONObjectWithId } from '@/lib/mapservices/GeoJsonCollection'


let mm: ManagedMap
let gList1: GeoJSONObjectWithId
let gList2: GeoJSONObjectWithId
let gList3: GeoJSONObjectWithId
let bboxexpectedg1g2: BBox
let bboxexpectedg1g3: BBox
let bbox1: BBox, bbox2: BBox, bbox3: BBox

const geojson: GeoJSON = {
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

const initData1: TrackInitData = {
  id: 1,
  name: 'mytrack1',
  length: 13.4,
  src: 'mysrc1',
  ascent: 134.5,
  time: "2021-03-04",
  timelength: null,
  geojson: null
}


const initData2: TrackInitData = {
  id: 2,
  name: 'mytrack2',
  length: 23.4,
  src: 'mysrc2',
  ascent: 234.5,
  time: "2022-10-11 23:01:17",
  geojson: null,
  timelength: null
}

const track1 = new Track(initData1)
const track2 = new Track(initData2)


beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)

  mm = new ManagedMap()
  bbox1 = [-20, -10.1, 40, 80]
  bbox2 = [-23, -11, -5, 70]
  bbox3 = [-30, 15, -28, 16]
  const g1: GeoJsonObject = geojson
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
  mm.addTrackLayer({ track: track1, geojson })
  mm.addTrackLayer({ track: track2, geojson })
  expect(mm.getTrackIds()).toEqual([1, 2])
  // eslint-disable-next-line no-unused-vars
  const l9 = mm.getTrackLayer(2)
  expect(l9).toBeDefined()
  mm.setInvisible(2)
  expect(mm.getTrackIdsVisible()).toEqual([1])
  expect(mm.getTrackIdsInVisible()).toEqual([2])
})

test('createLayer-getextent', () => {
  mm = new ManagedMap()
  mm.addTrackLayer({ track: track1, geojson })
  const layer = mm.getTrackLayer(1)
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
