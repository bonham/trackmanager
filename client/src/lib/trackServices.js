import { Track } from '@/lib/Track.js'
const _ = require('lodash')

// /// Get all tracks
async function getAllTracks () {
  const response = await fetch('/api/tracks/getall')
  const responseJson = await response.json()

  const trackArray = responseJson.map(t => new Track(t))
  return trackArray
}

// /// Get geojson by id
async function getGeoJson (idList) {
  const payload = { ids: idList }

  const url = '/api/tracks/geojson/'
  const req = new Request(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }

  )

  const response = await fetch(req)
  if (response.ok) {
    const respJson = response.json()
    return respJson
  } else {
    const errText = await response.text()
    throw new Error(`Response code ${response.status} after fetching to ${url}, error: ${errText}`)
  }
}

// /// Update Track
async function updateTrack (track, attributes) {
  const id = track.id
  const data = _.pick(track, attributes)

  const mybody = {
    updateAttributes: attributes,
    data: data
  }

  const req = new Request(
    `/api/tracks/byid/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mybody)
    }

  )

  try {
    const response = await fetch(req)
    if (response.ok) {
      return true
    } else {
      console.error(`Unable to update track ${id}`)
      console.error(response)
      console.error(await response.text())
      return false
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

export { getAllTracks, getGeoJson, updateTrack }
