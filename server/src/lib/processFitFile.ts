
import type { TrackPoint } from './Track.js';
import { Track } from './Track.js';
import { DateStringMatcher, StringCleaner } from './analyzeString.js';
import { FitFile } from './fit/FitFile.js';
import { writeTrack } from './trackWriteHelpers.js';

// read metadata from fit session messages ( avg speed, start time, distance, ascent )

// read all points with lat lon , time, ascent

// calculate segments

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

  // mangling of filename 
  const dateStrMatch = new DateStringMatcher(fileName)
  const fileNameWithoutDate = dateStrMatch.strippedString()

  const cleaner = new StringCleaner(fileNameWithoutDate)
  const cleanedFileName = cleaner.applyAll({ suffixList: ['gpx', 'fit'] })


  const track = new Track({
    name: cleanedFileName,
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

  await writeTrack({
    fileBuffer,
    database,
    schema,
    track
  })

}

export { processFitFile };

