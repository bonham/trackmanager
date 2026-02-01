import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { describe, test, vi } from 'vitest';
import { processGpxFile } from '../../src/lib/processGpxFile.js';
import { Track2DbWriter } from '../../src/lib/Track2DbWriter.js';

const twoSegmentsFilePath = path.join(__dirname, "../data/TwoSegments.gpx")
const oneTrackOneSegmentFilePath = path.join(__dirname, "../data/OneTrackOneSegment.gpx")
const twoTracks = path.join(__dirname, "../data/TwoTracks.gpx")
const gpxFileList = [
  [oneTrackOneSegmentFilePath],
  [twoSegmentsFilePath],
  [twoTracks],
]


type DbOpts = Parameters<InstanceType<typeof Track2DbWriter>['init']>[0];

vi.spyOn(Track2DbWriter.prototype, 'init').mockImplementation(() => Promise.resolve())
vi.spyOn(Track2DbWriter.prototype, 'write').mockImplementation(() => Promise.resolve(0))

describe("Process gpx file", () => {
  test.each(gpxFileList)("File %s", async (fpath) => {
    const buf = readFileSync(fpath)
    await processGpxFile(buf, "myfilename", "mydb", "myschema")
  })
})