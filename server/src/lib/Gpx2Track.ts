import * as tj from "@tmcw/togeojson";
import * as jsdom from 'jsdom';
import { DateTime } from 'luxon';

const JSDOM = jsdom.JSDOM

interface TrackMetadata {
  ascent?: number,
  timelength?: number,
  time?: Date
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

  extractExtensions() {

    // get all tracks
    const metaDataList: TrackMetadata[] = []
    // const trkElements = filterForTag(filterElements(this.doc.documentElement.childNodes), "trk")
    const trkElements = this.doc.getElementsByTagName('trk')
    Array.from(trkElements).forEach((trkEle) => {

      const trackMetaData: TrackMetadata = {}

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

  // toTrack() {

  //   const featureCollection = this.toGeoJson()
  //   const features = featureCollection.features

  //   const realFeatures = features.filter((f) => f.type == "Feature")
  //   // each feature is a track. Either with one segment ( Linestring ), or multiple segments ( MultiLineString )
  //   const lineFeatures = realFeatures.filter((f) => (f.geometry.type == "MultiLineString" || f.geometry.type == "LineString"))

  //   for (let feature of lineFeatures) {

  //     const props = feature.properties
  //     if (props === null) {
  //       console.error("Could not find properties for xxx")
  //       continue
  //     }
  //     const name = isString(props.name) ? props.name : undefined
  //     const dateString = isString(props.time) ? props.time : undefined

  //     const hasCoordinateTimes = (props.hasOwn('coordinateProperties') && props.coordinateProperties && props.coordinateProperties.hasOwn('times'))
  //     return false




  //     const track = new Track({
  //       name,
  //       source: undefined,
  //       undefine,
  //       totalDistance,
  //       durationSeconds: totalTimerTime,
  //       startTime,
  //     });
  //   }
  // }

}
export { Gpx2Track };

// function isString(x: unknown): x is string {
//   return typeof x === 'string'
// }


