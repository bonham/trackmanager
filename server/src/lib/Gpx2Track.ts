import * as tj from "@tmcw/togeojson";
import type { Feature, GeoJsonProperties, Geometry, Position } from "geojson";
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
  trackFeatures: Feature<Geometry, GeoJsonProperties>[];
  extendedSegments: ExtendedSegment[][]

  constructor(s: string) {
    this.s = s
    const parseResult = (new JSDOM(
      this.s,
      {
        contentType: "text/xml"
      }
    ))
    this.doc = parseResult.window.document
    this.trackFeatures = this._storeTrackFeatures()
    this.extendedSegments = this._storeExtendedSegments()

    if (this.trackFeatures.length !== this.numTracks()) throw Error(`Track features length '${this.trackFeatures.length} not matching ${this.numTracks()}`)
    if (this.extendedSegments.length !== this.numTracks()) throw Error(`Track extendedSegments length '${this.extendedSegments.length} not matching ${this.numTracks()}`)
  }

  _storeExtendedSegments(): ExtendedSegment[][] {

    const features = this.trackFeatures
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

  getExtendedSegments() {
    return this.extendedSegments
  }

  trackElements() {
    return this.doc.querySelectorAll(":scope > trk")
  }

  numTracks() {
    const trackElements = this.trackElements()
    return trackElements.length
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
   * @param trackNum track id
   * @returns List of objects containing extension data. Lenght of list should correspond to length of tracks.
   */
  trackMetadata(trackNum: number) {

    const trackFt = this.trackFeatures[trackNum]

    // extract metadata for track
    const props = trackFt.properties
    const tm: TrackMetadata = {}

    if (props !== null) {
      tm.name = isString(props.name) ? props.name : undefined

      if (isString(props.time)) {
        const tmpDate = new Date(props.time)
        tm.time = tmpDate.toString() === "Invalid Date" ? undefined : tmpDate
      }
    }

    // ascent
    const trkElements = this.trackElements()
    const trkEle = Array.from(trkElements)[trackNum]

    const ascentTags = trkEle.querySelectorAll(":scope > extensions > totalascent")
    const ascentText = getTextContentOfSingleElement(ascentTags)
    tm.ascent = ascentText ? parseFloat(ascentText) : undefined

    const timelengthTags = trkEle.querySelectorAll(':scope > extensions > timelength')
    const timelengthText = getTextContentOfSingleElement(timelengthTags)
    tm.timelength = timelengthText ? parseFloat(timelengthText) : undefined

    return tm
  }

  _storeTrackFeatures() {
    const featureCollection = tj.gpx(this.doc)
    return featureCollection.features.filter((ft) => ft.properties?._gpxType === 'trk')
  }

  getTrackFeatures() {
    return this.trackFeatures
  }
}

function isString(x: unknown): x is string {
  return typeof (x) === 'string'
}

export { Gpx2Track };




