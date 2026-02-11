
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Track } from '@/lib/Track'
import type { GeoJSONWithTrackId, GeoJsonWithTrack } from '@/lib/mapservices/ManagedMap'
import type { AsyncWorker } from 'async'
import { getTrackMetaDataByIdList, getGeoJson } from './trackServices';

type IdList = number[]
interface Task { idList: IdList, signal: AbortSignal }

/**
 * Loads tracks in batches and performs add function
 * @param idList List of ids
 * @param addToLayerFunction Function with signature f(number[], (gwt)=>void)
 */
function createTrackLoadingAsyncWorker(
  addToLayerFunction: (gwt: GeoJsonWithTrack) => void,
  sid: string
): AsyncWorker<Task> {

  const worker: AsyncWorker<Task> = async (task: Task) => {

    const { idList, signal } = task
    if (signal.aborted) return

    // ----
    const trackMetadataList = await getTrackMetaDataByIdList(idList, sid, signal)
    if (trackMetadataList === null) {
      throw Error("Track metadata list could not be loaded")
    }
    const trackMetadataMap = new Map<number, Track>()
    trackMetadataList.forEach((track) => trackMetadataMap.set(track.id, track))

    // ----
    if (signal.aborted) return
    const geoJsonList = await getGeoJson(idList, sid, signal)
    const geoJsonMap = new Map<number, GeoJSONWithTrackId>()
    geoJsonList.forEach((gwt) => geoJsonMap.set(gwt.id, gwt))

    // ----
    if (signal.aborted) return
    idList.forEach((id) => {
      const track = trackMetadataMap.get(id)
      if (track === undefined) throw Error(`Track for id ${id} is undefined`)

      const geoJsonWithId = geoJsonMap.get(id)
      if (geoJsonWithId === undefined) throw Error(`GeoJson for id ${id} is undefined`)

      const geoJsonWithTrack: GeoJsonWithTrack = {
        track,
        geojson: geoJsonWithId.geojson
      }
      if (signal.aborted) return
      addToLayerFunction(geoJsonWithTrack)
    })
  }
  return worker
}
export { createTrackLoadingAsyncWorker, type IdList, type Task }


