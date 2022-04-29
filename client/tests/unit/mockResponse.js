const mockTrack = {
  id: 404,
  name: 'Saupferchweg',
  length: 46238.20565667874,
  src: '20210919_Saupferchweg.gpx',
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

const responseMockFunction = (req) => {
  const mockTrackListResponse = JSON.stringify([mockTrack])
  const mockGeoJsonListResponse = JSON.stringify([mockGeoJson])

  if (req.url.includes('getall')) {
    return new Promise(resolve => resolve(mockTrackListResponse))
  } else if (req.url.includes('byyear')) {
    return new Promise(resolve => resolve(mockTrackListResponse))
  } else if (req.url.includes('geojson')) {
    return new Promise(resolve => resolve(mockGeoJsonListResponse))
  } else {
    throw new Error(`Url ${req.url} is not mocked`)
  }
}

export { responseMockFunction }
