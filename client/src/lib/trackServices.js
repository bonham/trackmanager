import { Track } from '@/lib/Track.js'
const _ = require('lodash')

// /// Get all tracks
async function getAllTracks (sid) {
  const response = await fetch(`/api/tracks/getall/sid/${sid}`)
  const responseJson = await response.json()

  const trackArray = responseJson.map(t => new Track(t))
  return trackArray
}

// /// Get tracks by year
async function getTracksByYear (year, sid) {
  if (!_.isInteger(year)) throw Error('Year is not integer: ' + year)
  const url = `/api/tracks/byyear/${year}/sid/${sid}`
  let response
  try {
    response = await fetch(url)
  } catch (error) {
    console.error('Error when fetching tracks by year', error)
    return []
  }
  if (!response.ok) {
    console.error('Response not ok when fetching tracks by year', response)
    return []
  }

  try {
    const responseJson = await response.json()
    const trackArray = responseJson.map(t => new Track(t))
    return trackArray
  } catch (error) {
    console.error('Error when processing result from http call', error)
    return []
  }
}

// /// Get geojson by id
async function getGeoJson (idList, sid) {
  const payload = { ids: idList }

  const url = `/api/tracks/geojson/sid/${sid}`
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
async function updateTrack (track, attributes, sid) {
  const id = track.id
  console.log('track id in trackServices/updateTrack', id)
  const data = _.pick(track, attributes)

  const mybody = {
    updateAttributes: attributes,
    data: data
  }

  const req = new Request(
    `/api/tracks/byid/${id}/sid/${sid}`,
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

export { getAllTracks, getTracksByYear, getGeoJson, updateTrack }
