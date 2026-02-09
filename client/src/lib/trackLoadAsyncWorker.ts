
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Track } from '@/lib/Track'
import type { GeoJSONWithTrackId, GeoJsonWithTrack } from '@/lib/mapservices/ManagedMap'
import type { AsyncWorker } from 'async'
import { getTrackMetaDataByIdList, getGeoJson } from './trackServices';

type IdList = number[]

/**
 * Loads tracks in batches and performs add function
 * @param idList List of ids
 * @param addToLayerFunction Function with signature f(number[], (gwt)=>void)
 */
function createTrackLoadingAsyncWorker(
  addToLayerFunction: (gwt: GeoJsonWithTrack) => void,
  sid: string
): AsyncWorker<IdList> {

  const worker: AsyncWorker<IdList> = async (idListTask: IdList) => {

    // ----
    const trackMetadataList = await getTrackMetaDataByIdList(idListTask, sid)
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
  return worker
}
export { createTrackLoadingAsyncWorker, type IdList }


