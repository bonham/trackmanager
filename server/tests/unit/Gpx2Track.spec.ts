import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { Gpx2Track } from "../../src/lib/Gpx2Track.js";

const mFilePath = path.join(__dirname, "../data/TwoSegments.gpx")
const gpxFileList = [
  [path.join(__dirname, "../data/OneTrackOneSegment.gpx"), 1, 1, 387],
  [path.join(__dirname, "../data/TwoSegments.gpx"), 1, 2, 519],
]

describe("Convert gpx to geojson", () => {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test.each(gpxFileList)("gpx file %s", async (fpath, numTracks, numSegments, numPoints1stSeg) => {
    const f = await readFile(fpath as string, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const gj = gpt.toGeoJson()
    expect(gj).toHaveProperty("type", "FeatureCollection")
    const features = gj.features
    expect(Array.isArray(features)).toBeTruthy()
    expect(features.length).toBe(numTracks)

    // test if all features are features 
    const realFeatures = features.filter((f) => f.type == "Feature")
    expect(realFeatures.length).toEqual(numTracks)

    // count segments of first track
    let actualNumberOfSegments = 0
    let actualNumPointsInFirstSegment: number

    if (features.length > 0) {
      const track = features[0]
      if (track.geometry.type == "LineString") {
        actualNumberOfSegments = 1
        actualNumPointsInFirstSegment = track.geometry.coordinates.length
      } else if (track.geometry.type == "MultiLineString") {
        actualNumberOfSegments = track.geometry.coordinates.length
        if (actualNumberOfSegments < 1) throw Error("no segment")
        actualNumPointsInFirstSegment = track.geometry.coordinates[0].length
      } else {
        actualNumberOfSegments = 0
        actualNumPointsInFirstSegment = 0
      }
      expect(actualNumberOfSegments).toEqual(numSegments)
      expect(actualNumPointsInFirstSegment).toEqual(numPoints1stSeg)
    }



  })
  test("Extensions", async () => {
    const f = await readFile(mFilePath, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const trackMetadata = gpt.extractExtensions()
    expect(trackMetadata).toHaveLength(1)
    expect(trackMetadata[0].ascent).toEqual(2089.209370)
    expect(trackMetadata[0].timelength).toEqual(8926)
    expect(trackMetadata[0].time).toEqual(new Date('1984-05-23T22:06:07Z'))
  })
  test("Metadata Start time", async () => {
    const f = await readFile(mFilePath, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const start = gpt.extractStartTimeFromMetadata()
    expect(start).toEqual(new Date('2013-05-23T22:06:07+00:00'))
  })
})