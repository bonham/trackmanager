import { describe, jest, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';
import { processGpxFile } from '../../src/lib/processGpxFile.js';

import { Track2DbWriter } from '../../src/lib/Track2DbWriter.js';
jest.mock('../../src/lib/Track2DbWriter.js')

const twoSegmentsFilePath = path.join(__dirname, "../data/TwoSegments.gpx")
const oneTrackOneSegmentFilePath = path.join(__dirname, "../data/OneTrackOneSegment.gpx")
const gpxFileList = [
  [oneTrackOneSegmentFilePath],
  [twoSegmentsFilePath],
]


type DbOpts = Parameters<InstanceType<typeof Track2DbWriter>['init']>[0];

const mockInit = jest.fn<(o: DbOpts) => Promise<void>>();
const mockWrite = jest.fn<() => Promise<number>>()
jest.spyOn(Track2DbWriter.prototype, 'write').mockImplementation(mockWrite)
jest.spyOn(Track2DbWriter.prototype, 'init').mockImplementation(mockInit)

describe("Process gpx file", () => {
  test.each(gpxFileList)("File %s", async (fpath) => {
    const buf = readFileSync(fpath)
    await processGpxFile(buf, "myfilename", "mydb", "myschema")
  })
})