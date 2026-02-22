import * as tj from "@tmcw/togeojson";
import { DOMParser, Document as XmlDomDocument } from "@xmldom/xmldom";
import type { Feature, GeoJsonProperties, Geometry, Position } from "geojson";
import { DateTime } from 'luxon';
import xpath from "xpath";

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


class Gpx2Track {
  s: string;
  doc: XmlDomDocument;
  trackFeatures: Feature<Geometry, GeoJsonProperties>[];
  extendedSegments: ExtendedSegment[][]

  select: ReturnType<typeof xpath.useNamespaces>;

  constructor(s: string) {
    this.s = s

    const parser = new DOMParser();
    this.doc = parser.parseFromString(s, "text/xml");

    this.select = xpath.useNamespaces({
      'g': 'http://www.topografix.com/GPX/1/1'
    });


    this.trackFeatures = this._storeTrackFeatures()
    this.extendedSegments = this._storeExtendedSegments()

    if (this.trackFeatures.length !== this.numTracks()) throw Error(`Track features length '${this.trackFeatures.length} not matching ${this.numTracks()}`)
    if (this.extendedSegments.length !== this.numTracks()) throw Error(`Track extendedSegments length '${this.extendedSegments.length} not matching ${this.numTracks()}`)
  }


  _storeExtendedSegments(): ExtendedSegment[][] {

    const features = this.trackFeatures
    const tracks: ExtendedSegment[][] = []

    // Iterate over tracks
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
        // check if number of segments matching number of property array entries
        const numCoordinateSegments = trackGeometry.coordinates.length
        let validProperties: boolean
        if (
          props !== null &&
          isPropsWithTimes(props)
        ) {
          const numPropertySegments = props.coordinateProperties.times.length

          if (numPropertySegments === numCoordinateSegments) {
            validProperties = true
          } else {
            console.error(`Coordinate segments: ${numCoordinateSegments} differ from property segments: ${numPropertySegments}. Skipping creation of times for points`)
            validProperties = false
          }
        } else {
          console.log("feature.properties is null or does not have 'times' property")
          validProperties = false
        }

        // fill extended segments array
        for (let segNum = 0; segNum < trackGeometry.coordinates.length; segNum++) {
          const coordinatesOfSegment = trackGeometry.coordinates[segNum]

          let timeStringList: (string[] | undefined[])
          const numPointsInSegment = coordinatesOfSegment.length

          if (
            validProperties &&
            props !== null && isPropsWithTimes(props) &&
            Array.isArray(props.coordinateProperties.times[segNum]) &&
            props.coordinateProperties.times[segNum].length === numPointsInSegment
          ) {
            timeStringList = (props.coordinateProperties.times[segNum] as string[])
          } else {
            console.error(`Properties for segment ${segNum} are invalid.`)
            timeStringList = Array<undefined>(coordinatesOfSegment.length).fill(undefined)
          }
          eSegments.push({ positionList: coordinatesOfSegment, timeStringList })

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

    const trkNodes = this.select("/g:gpx/g:trk", this.doc as unknown as Node) as Node[];
    const trkNodesArray = Array.from(trkNodes)
    return trkNodesArray
  }

  numTracks() {
    const trackElements = this.trackElements()
    return trackElements.length
  }

  extractStartTimeFromMetadata() {
    const timeElements = this.select("/g:gpx/g:metadata/g:time", this.doc as unknown as Node) as Node[];
    const firstTimeElement = timeElements[0] as Node | undefined;
    const dateText = firstTimeElement?.firstChild?.nodeValue;

    if (dateText !== undefined && dateText !== null) {
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
    const trkEle = trkElements[trackNum]



    const ascentNodeList = this.select("./g:extensions/g:totalascent", trkEle) as Node[];
    const firstAscentNode = ascentNodeList[0] as Node | undefined;
    const ascentText = firstAscentNode?.firstChild?.nodeValue;
    tm.ascent = ascentText ? parseFloat(ascentText) : undefined

    const timeLengthNodeList = this.select("./g:extensions/g:timelength", trkEle) as Node[];
    const firstTimeLengthNode = timeLengthNodeList[0] as Node | undefined;
    const timelengthText = firstTimeLengthNode?.firstChild?.nodeValue;
    tm.timelength = timelengthText ? parseFloat(timelengthText) : undefined

    return tm
  }

  _storeTrackFeatures() {
    const featureCollection = tj.gpx(this.doc as unknown as Document)
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




