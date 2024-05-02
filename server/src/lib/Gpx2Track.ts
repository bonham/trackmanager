import * as tj from "@tmcw/togeojson";
import * as jsdom from 'jsdom';
const JSDOM = jsdom.JSDOM

interface TrackMetadata {
  ascent?: number,
  timelength?: number,
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

  extractExtensions() {

    // get all tracks
    const metaDataList: TrackMetadata[] = []
    // const trkElements = filterForTag(filterElements(this.doc.documentElement.childNodes), "trk")
    const trkElements = this.doc.getElementsByTagName('trk')
    Array.from(trkElements).forEach((trkEle) => {

      const trackMetaData: TrackMetadata = {}

      const extensionElements = Array.from(trkEle.querySelectorAll(":scope > extensions"))
      if (extensionElements.length > 1) throw Error("Multiple <extensions> elements in track")
      else if (extensionElements.length === 1) {

        const extNode = extensionElements[0]

        const ascentTags = extNode.querySelectorAll(':scope > totalascent')
        if (ascentTags.length > 1) throw Error(`Number of ascent tags is ${ascentTags.length}`)
        else if (ascentTags.length === 1) {
          const tmpVal = ascentTags[0].textContent
          if (tmpVal !== null) {
            trackMetaData.ascent = parseFloat(tmpVal)
          }
        }
        const timelengthTags = Array.from(extNode.querySelectorAll(':scope >timelength'))
        if (timelengthTags.length > 1) throw Error(`Number of timelengthTags tags is ${timelengthTags.length}`)
        else if (timelengthTags.length === 1) {
          const tmpVal = timelengthTags[0].textContent
          if (tmpVal !== null) {
            trackMetaData.timelength = parseFloat(tmpVal)
          }
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


