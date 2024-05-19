import * as tj from "@tmcw/togeojson";
import type { Position } from "geojson";
import * as jsdom from 'jsdom';
import { DateTime } from 'luxon';

const JSDOM = jsdom.JSDOM

interface TrackMetadata {
  name?: string,
  ascent?: number,
  timelength?: number,
  time?: Date
}

type TimeStringList = (string | undefined)[]
interface ExtendedSegment {
  positionList: Position[],
  timeStringList: TimeStringList
}

interface PropsWithTimes {
  coordinateProperties: {
    times: (string[] | string[][])
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPropsWithTimes(props: Record<string, any>): props is PropsWithTimes {
  if (
    (props !== null) &&
    (typeof props === 'object') &&
    Object.hasOwn(props, 'coordinateProperties') &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.hasOwn(props.coordinateProperties, 'times') &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Array.isArray(props.coordinateProperties.times)
  ) {
    return true
  } else {
    return false
  }
}

function getTextContentOfSingleElement(nList: NodeListOf<Element>): (string | undefined) {
  const ar = Array.from(nList)
  if (ar.length > 1) {
    throw new Error("Array should not not contain more than one element")
  } else if (ar.length === 1) {
    const text = ar[0].textContent
    return (text ?? undefined)
  }
  else {
    return undefined
  }
}




class Gpx2Track {
  s: string;
  doc: Document;

  constructor(s: string) {
    this.s = s
    const parseResult = (new JSDOM(
      this.s,
      {
        contentType: "text/xml"
      }
    ))
    this.doc = parseResult.window.document
  }

  parseCoordinates(): ExtendedSegment[][] {
    const featureCollection = this.toGeoJson()
    const features = featureCollection.features
    const tracks: ExtendedSegment[][] = []

    // Iterate over tracks
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let trackNum = 0; trackNum < features.length; trackNum++) {
      const eSegments: ExtendedSegment[] = []

      const feature = features[trackNum]
      const trackGeometry = feature.geometry

      const props = feature.properties
      // Identify segments
      if (trackGeometry.type === "LineString") {
        const co = trackGeometry.coordinates
        let timeStringList: (string[] | undefined[])

        if (props !== null && isPropsWithTimes(props)) {
          timeStringList = (props.coordinateProperties.times as string[])
        } else {
          timeStringList = Array<undefined>(co.length).fill(undefined)
        }
        eSegments.push({ positionList: co, timeStringList })
      } else if (trackGeometry.type === "MultiLineString") {
        for (let segNum = 0; segNum < trackGeometry.coordinates.length; segNum++) {
          const co = trackGeometry.coordinates[segNum]
          let timeStringList: (string[] | undefined[])

          if (props !== null && isPropsWithTimes(props)) {
            timeStringList = (props.coordinateProperties.times[segNum] as string[])
          } else {
            timeStringList = Array<undefined>(co.length).fill(undefined)
          }
          eSegments.push({ positionList: co, timeStringList })

        }
      } else console.error(`Unexpected type ${trackGeometry.type} found`)
      tracks.push(eSegments)
    }
    return tracks
  }

  trackElements() {
    return this.doc.querySelectorAll(":scope > trk")
  }

  numTracks() {
    const trackElements = this.trackElements()
    return trackElements.length
  }

  /**
   * Extract coordinates for tracks and segments
   * 
   * @returns Feature collection - each feature representing a track
   */
  toGeoJson() {
    const featureCollection = tj.gpx(this.doc)
    return featureCollection
  }

  extractStartTimeFromMetadata() {
    const timeElements = this.doc.querySelectorAll(":scope > metadata > time")
    const dateText = getTextContentOfSingleElement(timeElements)
    if (dateText !== undefined) {
      const startDate = DateTime.fromISO(dateText)
      if (startDate.isValid) {
        const startDateValid = (startDate as DateTime<true>)
        return startDateValid.toJSDate()
      }
    }
  }

  /**
   * Get extension metadata for all tracks
   * @returns List of objects containing extension data. Lenght of list should correspond to length of tracks.
   */
  extractMetadata() {

    // get all tracks
    const metaDataList: TrackMetadata[] = []
    // const trkElements = filterForTag(filterElements(this.doc.documentElement.childNodes), "trk")
    const trkElements = this.trackElements()
    Array.from(trkElements).forEach((trkEle) => {

      const trackMetaData: TrackMetadata = {}

      // <name> property of <trd>
      const nameElements = trkEle.querySelectorAll(":scope > name")
      const trackName = getTextContentOfSingleElement(nameElements)
      trackMetaData.name = trackName

      // <extensions>
      const ascentTags = trkEle.querySelectorAll(":scope > extensions > totalascent")
      const ascentText = getTextContentOfSingleElement(ascentTags)
      trackMetaData.ascent = ascentText ? parseFloat(ascentText) : undefined

      const timelengthTags = trkEle.querySelectorAll(':scope > extensions > timelength')
      const timelengthText = getTextContentOfSingleElement(timelengthTags)
      trackMetaData.timelength = timelengthText ? parseFloat(timelengthText) : undefined

      const timeTags = trkEle.querySelectorAll(':scope > extensions > time')
      const timeText = getTextContentOfSingleElement(timeTags)

      if (timeText !== undefined) {
        const startDate = DateTime.fromISO(timeText)
        if (startDate.isValid) {
          const startDateValid = (startDate as DateTime<true>)
          trackMetaData.time = startDateValid.toJSDate()
        }
      }
      metaDataList.push(trackMetaData)
    })
    return metaDataList
  }

}
export { Gpx2Track };


