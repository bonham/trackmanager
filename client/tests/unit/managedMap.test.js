
import './mockJsdom'
import { ManagedMap } from '../../src/lib/mapServices'
let mm
let geojson

beforeEach(() => {
  mm = new ManagedMap()
  geojson = {
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
})

test('Simple', () => {
  expect(mm.map).toBeDefined()
})

test('Add layer', () => {
  mm = new ManagedMap()
  mm.addTrackLayer({ id: 8, geojson: geojson })
  mm.addTrackLayer({ id: 9, geojson: geojson })
  expect(mm.getLayerIds()).toEqual([8, 9])
  // eslint-disable-next-line no-unused-vars
  const l9 = mm.getTrackLayer(9)
  mm.setInvisible(9)
  expect(mm.getLayerIdsVisible()).toEqual([8])
  expect(mm.getLayerIdsInVisible()).toEqual([9])
})
