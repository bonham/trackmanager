import { Request, Response } from 'cross-fetch'
import { vi } from 'vitest'

const mockTrack = {
  id: 404,
  name: 'Saupferchweg',
  length: 46238.20565667874,
  src: '20210919_Muellerweg.gpx',
  time: '2021-09-19T14:35:14.000Z',
  timelength: 8470,
  ascent: 866.7277609999995
}
const mockGeoJson = {
  id: 404,
  geojson: {
    type: 'MultiLineString',
    crs: {
      type: 'name',
      properties: {
        name: 'EPSG:4326'
      }
    },
    bbox: [
      8.59727,
      47.2,
      8.56,
      47.28
    ],
    coordinates: [
      [
        [
          8.596649,
          47.288593
        ],
        [
          8.597739,
          47.788265
        ]
      ]
    ]
  }
}

const mockTrackListResponse = JSON.stringify([mockTrack])
const mockGeoJsonListResponse = JSON.stringify([mockGeoJson])
const mockSingleTrackResponse = JSON.stringify(mockTrack)

const mockFetch = vi.fn((reqOrUrl) => {
  const req = new Request(reqOrUrl)

  if (req.url.match('^/api/tracks/getall/sid/[A-Za-z0-9]+')) {
    return new Response(mockTrackListResponse)
  } else if (req.url.match('^/api/tracks/byyear/\\d+/sid/[A-Za-z0-9]+')) {
    return new Response(mockTrackListResponse)
  } else if (req.url.match('^/api/tracks/geojson/sid/[A-Za-z0-9]+')) {
    return new Response(mockGeoJsonListResponse)
  } else if (req.url.match('^/api/tracks/byid/404/sid/[A-Za-z0-9]+')) {
    return new Response(mockSingleTrackResponse)
  } else if (req.url.match('^/api/config/get/sid/abcd1234/SCHEMA/TRACKSTYLE')) {
    return new Response(JSON.stringify({ value: null }))
  } else {
    throw new Error(`Url ${req.url} is not mocked`)
  }
})

export { mockFetch }
