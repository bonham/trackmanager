import { Track, isTrackDataServer } from '@/lib/Track'
import type { TrackPropertiesOptional } from '@/lib/Track'
import _ from 'lodash'
import type { GeoJSONWithTrackId } from '@/lib/mapservices/ManagedMap'
import type { Extent } from 'ol/extent'
// /// Get all tracks
async function getAllTracks(sid: string) {
  const response = await fetch(`/api/tracks/getall/sid/${sid}`)
  const responseJson = await response.json() as unknown

  if (!Array.isArray(responseJson)) throw Error("not array")
  if (!responseJson.every(isTrackDataServer)) throw Error("not array of trackdata")

  const trackArray = responseJson.map(t => new Track(t))
  return trackArray
}

// /// Get tracks by year
async function getTracksByYear(year: number, sid: string) {
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
    const responseJson = await response.json() as unknown

    if (!Array.isArray(responseJson)) throw Error("not array")
    if (!responseJson.every(isTrackDataServer)) throw Error("not array of trackdata")

    const trackArray = responseJson.map(t => new Track(t))
    return trackArray
  } catch (error) {
    console.error('Error when processing result from http call', error)
    return []
  }
}

// /// Get tracks by year
async function getTracksByExtent(extent: Extent, sid: string) {

  const url = `/api/tracks/byextent/sid/${sid}`
  const body = JSON.stringify(extent)
  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error when fetching tracks by extent', error)
    return []
  }
  if (!response.ok) {
    console.error('Response not ok when fetching tracks by extent', response)
    return []
  }

  try {
    const responseJson = await response.json() as unknown

    if (!Array.isArray(responseJson)) throw Error("not array")
    if (!responseJson.every(isTrackDataServer)) throw Error("not array of trackdata")

    const trackArray = responseJson.map(t => new Track(t))
    return trackArray
  } catch (error) {
    console.error('Error when processing result from http call', error)
    return []
  }
}

async function getTrackById(id: number, sid: string): Promise<Track | null> {
  const url = `/api/tracks/byid/${id}/sid/${sid}`
  let response
  try {
    response = await fetch(url)
  } catch (error) {
    console.error('Error when fetching tracks by year', error)
    return null
  }
  if (!response.ok) {
    const errText = await response.text()
    console.error(`Response code ${response.status} after fetching to ${url}, error: ${errText}`)
    return null
  }

  try {
    const responseJson = await response.json() as unknown

    if (!isTrackDataServer(responseJson)) throw Error("not trackdata")

    const track = new Track(responseJson)
    return track
  } catch (error) {
    console.error('Error when processing result from http call', error)
    return null
  }
}

// /// Get geojson by id
async function getGeoJson(idList: number[], sid: string) {
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
    let respJson
    try {
      respJson = (await response.json() as GeoJSONWithTrackId[])
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.log(e)
        throw new Error('Failed to convert response to json. Response')
      } else throw new Error("Unknown error after trying to read json response")
    }
    return respJson
  } else {
    const errText = await response.text()
    throw new Error(`Response code ${response.status} after fetching to ${url}, error: ${errText}`)
  }
}

async function updateTrack(track: Track, attributes: string[], sid: string) {
  const id = track.id
  const keyValuePairs = _.pick(track, attributes)
  await updateTrackById(id, keyValuePairs, sid)
}

async function updateTrackById(trackId: number, keyValuePairs: TrackPropertiesOptional, sid: string) {
  const id = trackId
  const attributes = _.keys(keyValuePairs) // hopefully we can deprecate this from the api soon
  const mybody = {
    updateAttributes: attributes,
    data: keyValuePairs
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

async function updateNameFromSource(id: number, sid: string): Promise<boolean> {
  console.log("++")
  const req = new Request(
    `/api/tracks/namefromsrc/${id}/sid/${sid}`,
    {
      method: 'PATCH',
    }
  )
  try {
    console.log("++ do fetch")
    const response = await fetch(req)
    if (response.status === 204) {
      console.log("yeah")
      return true
    } else {
      console.error(`Unable to convert src to name for track ${id}. Response status ${response.status}`)
      const body = await response.text()
      console.error(`Body: ${body}`)
      return false
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

async function deleteTrack(id: number, sid: string) {
  const req = new Request(
    `/api/tracks/byid/${id}/sid/${sid}`,
    {
      method: 'DELETE'
    }

  )

  try {
    const response = await fetch(req)
    if (response.ok) {
      return true
    } else {
      console.error(`Unable to delete track ${id}`)
      console.error(response)
      console.error(await response.text())
      return false
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

export {
  getAllTracks, getTracksByYear, getGeoJson,
  updateTrack, updateTrackById,
  deleteTrack, getTrackById, getTracksByExtent,
  updateNameFromSource
}
