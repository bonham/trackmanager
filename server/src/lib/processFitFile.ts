
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

  const segments = fitFile.getRecordMessageList(); // default join distance of 10
  segments.forEach((segment) => {
    const trackpts: TrackPoint[] = [];

    segment.getMessages().forEach((recordMessage) => {
      const [lat, lon] = recordMessage.getLatLon()
      const fitMsg = recordMessage.getFitMessage()
      const elevation = fitMsg.altitude
      const point_time = fitMsg.timestamp
      if (elevation === undefined) throw Error("Elevation not defined")

      trackpts.push({
        lat,
        lon,
        elevation,
        point_time
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

  const id: number = await dbw.write(track);
  console.log(`Track created with id ${id}`);
}

export { processFitFile };

