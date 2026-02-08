/* eslint-disable @typescript-eslint/no-misused-promises */
import { Track, isTrackDataServer } from '@/lib/Track'
import type { TrackPropertiesOptional } from '@/lib/Track'
import _ from 'lodash'
import type { GeoJSONWithTrackId, GeoJsonWithTrack } from '@/lib/mapservices/ManagedMap'
import type { Extent } from 'ol/extent'
import { queue } from 'async';
import type { AsyncWorker } from 'async'

import * as z from 'zod'

type IdList = number[]

/**
 * Gets a list of all track ids of map. First the tracks in the view are returned, newest first
 * then the other tracks , newest first
 * @param extent Map extent number[]
 * @param sid schema id
 * @returns Array of ids
 */
async function getIdListByExtentAndTime(extent: Extent, sid: string): Promise<number[]> {

  const idListResponse = await fetch(
    `/api/tracks/idlist/byextentbytime/sid/${sid}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extent)
    })
  const idListResponseJson = await idListResponse.json() as unknown
  const idList = z.array(z.number().int().nonnegative()).parse(idListResponseJson)
  return idList
}


/**
 * Loads tracks in batches and performs add function
 * @param idList List of ids
 * @param addToLayerFunction Function with signature f(number[], (gwt)=>void)
 */
function loadTracksNew(
  idList: number[],
  addToLayerFunction: (gwt: GeoJsonWithTrack) => void,
  sid: string
) {

  const worker: AsyncWorker<IdList> = async (idListTask: IdList) => {

    // ----
    const trackMetadataList = await getTracksByIdList(idListTask, sid)
    if (trackMetadataList === null) {
      throw Error("Track metadata list could not be loaded")
    }
    const trackMetadataMap = new Map<number, Track>()
    trackMetadataList.forEach((track) => trackMetadataMap.set(track.id, track))

    // ----
    const geoJsonList = await getGeoJson(idListTask, sid)
    const geoJsonMap = new Map<number, GeoJSONWithTrackId>()
    geoJsonList.forEach((gwt) => geoJsonMap.set(gwt.id, gwt))

    // ----
    idListTask.forEach((id) => {
      const track = trackMetadataMap.get(id)
      if (track === undefined) throw Error(`Track for id ${id} is undefined`)

      const geoJsonWithId = geoJsonMap.get(id)
      if (geoJsonWithId === undefined) throw Error(`GeoJson for id ${id} is undefined`)

      const geoJsonWithTrack: GeoJsonWithTrack = {
        track,
        geojson: geoJsonWithId.geojson
      }
      addToLayerFunction(geoJsonWithTrack)
    })
  }

  const addQueue = queue(worker, 4)

  const batchSize = 5
  for (let i = 0; i < idList.length; i += batchSize) {
    const batchIds = idList.slice(i, i + batchSize)
    addQueue.push<IdList>([batchIds], (err, retVal) => {
      if (err) console.error("Error in worker", err)
      if (retVal) console.log("Return value from worker", retVal)
    }
    )
  }
}

// /// Get all tracks
async function getAllTracks(sid: string) {
  const response = await fetch(`/api/tracks/getall/sid/${sid}`)
  const responseJson = await response.json() as unknown

  if (!Array.isArray(responseJson)) throw Error("not array")
  if (!responseJson.every(isTrackDataServer)) throw Error("not array of trackdata")

  const trackArray = responseJson.map(t => new Track(t))
  return trackArray
}

// /// Get years of all tracks
async function getTrackYears(sid: string): Promise<number[]> {
  const url = `/api/tracks/trackyears/sid/${sid}`
  let response: Response
  try {
    response = await fetch(url)
  } catch (error) {
    console.error('Error when fetching years of tracks', error)
    return []
  }
  if (!response.ok) {
    console.error('Response not ok when fetching tracks by year', response)
    return []
  }

  try {
    const responseJson = await response.json() as unknown
    const YearList = z.array(z.coerce.number());
    const years = YearList.parse(responseJson)
    return years

  } catch (error) {
    console.error('Error when processing result from http call', error)
    return []
  }
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

// /// Get tracks by extent
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

async function getTracksByIdList(idList: number[], sid: string): Promise<Track[] | null> {

  const url = `/api/tracks/bylist/sid/${sid}`
  let response
  try {
    response = await fetch(url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idList)
      }
    )
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
    const trackDataGetall = z.array(z.object({
      id: z.number().int().nonnegative(),
      name: z.string().nullable(),
      length: z.number().nullable(),
      src: z.string().nullable(),
      time: z.string().nullable(),
      ascent: z.number().nullable()
    })).parse(responseJson)

    const trackList = trackDataGetall.map(td => new Track(td))
    return trackList

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
  getAllTracks, getTrackYears, getTracksByYear, getGeoJson, getTracksByIdList as getTrackByIdList,
  updateTrack, updateTrackById,
  deleteTrack, getTrackById, getTracksByExtent,
  updateNameFromSource,
  getIdListByExtentAndTime, loadTracksNew
}
