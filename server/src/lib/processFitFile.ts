
import { createHash } from 'node:crypto';
import type { TrackPoint } from './Track.js';
import { Track } from './Track.js';
import { Track2DbWriter } from './Track2DbWriter.js';
import { FitFile } from './fit/FitFile.js';

// read metadata from fit session messages ( avg speed, start time, distance, ascent )

// read all points with lat lon , time, ascent

// calculate segments

function hashBuffer(buffer: Buffer) {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

async function processFitFile(
  fileBuffer: Buffer,
  fileName: string,
  database: string,
  schema: string,
) {
  const fitFile = new FitFile(fileBuffer);
  const session = fitFile.getFirstSessionMessage();
  const {
    startTime,
    totalDistance,
    totalAscent,
    totalTimerTime,
  } = session;

  if (!startTime) throw new Error('Fit file does not have start time in session');

  const track = new Track({
    name: undefined,
    source: fileName,
    totalAscent,
    totalDistance,
    durationSeconds: totalTimerTime,
    startTime,
  });

  const segments = fitFile.getRecordMessageList();
  segments.forEach((segment) => {
    const trackpts: TrackPoint[] = [];

    segment.getFitMessages().forEach((fit) => {
      if (fit.positionLat === undefined) throw new Error('pos lat undef');
      if (fit.positionLong === undefined) throw new Error('pos lon undef');
      if (fit.altitude === undefined) throw new Error('altitude undef');

      trackpts.push({
        lat: fit.positionLat,
        lon: fit.positionLong,
        elevation: fit.altitude,
      });
    });
    track.addSegment(trackpts);
  });

  const fileHash = hashBuffer(fileBuffer);

  const dbw = new Track2DbWriter({
    dbName: database,
    dbSchema: schema,
    dbHost: 'localhost',
    dbUser: 'postgres',
  }, fileHash);

  const id = await dbw.write(track);
  console.log(`Track created with id ${id}`);
}

export { processFitFile };

