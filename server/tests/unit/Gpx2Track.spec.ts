import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { describe, expect, test } from 'vitest';
import { Gpx2Track } from "../../src/lib/Gpx2Track.js";

const twoSegmentsFilePath = path.join(__dirname, "../data/TwoSegments.gpx")
const oneTrackOneSegmentFilePath = path.join(__dirname, "../data/OneTrackOneSegment.gpx")
const twoTracks = path.join(__dirname, "../data/TwoTracks.gpx")
const gpxFileList = [
  [oneTrackOneSegmentFilePath, 1, 1, 385],
  [twoSegmentsFilePath, 1, 2, 519],
  [twoTracks, 2, 1, 2],
]

describe("Convert gpx to geojson", () => {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test.each(gpxFileList)("gpx file %s", async (fpath, numTracks, numSegments1stTrack, numPoints1stSeg) => {
    const f = await readFile(fpath as string, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)

    // check number of tracks
    expect(gpt.numTracks()).toBe(numTracks)

    // each feature is a track
    const features = gpt.getTrackFeatures()
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
      expect(actualNumberOfSegments).toEqual(numSegments1stTrack)
      expect(actualNumPointsInFirstSegment).toEqual(numPoints1stSeg)
    }



  })
  test("Extensions", async () => {
    const f = await readFile(twoSegmentsFilePath, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const tm = gpt.trackMetadata(0)
    expect(tm.ascent).toEqual(2089.209370)
    expect(tm.timelength).toEqual(8926)
    expect(tm.time).toEqual(new Date('1984-05-23T22:06:07Z'))
    expect(tm.name).toEqual('TwoSegmentsName')
  })
  test("Metadata Start time", async () => {
    const f = await readFile(twoSegmentsFilePath, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const start = gpt.extractStartTimeFromMetadata()
    expect(start).toEqual(new Date('2013-05-23T22:06:07+00:00'))
  })

  test("Lat Lon ele time onetrackoneseg", async () => {
    const f = await readFile(oneTrackOneSegmentFilePath, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const x = gpt.getExtendedSegments()
    const eseg = x[0][0]
    const pl = eseg.positionList[0]
    expect(pl[1]).toEqual(49.177111)
    expect(pl[0]).toEqual(7.799191)
    expect(pl[2]).toEqual(134.977754)
    const timeList = eseg.timeStringList
    expect(timeList[0]).toEqual("1013-01-17T15:17:37Z")
  })

  test("Lat Lon ele time twosegs", async () => {
    const f = await readFile(twoSegmentsFilePath, { encoding: 'utf-8' })
    const gpt = new Gpx2Track(f)
    const x = gpt.getExtendedSegments()
    const eseg = x[0][0]
    const pl = eseg.positionList[0]
    expect(pl[1]).toEqual(93.932797)
    expect(pl[0]).toEqual(8.682082)
    expect(pl[2]).toEqual(222.822990)
    const timeList = eseg.timeStringList
    expect(timeList[0]).toEqual("1984-05-23T22:06:07Z")
  })

})