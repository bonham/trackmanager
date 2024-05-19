
import { Gpx2Track } from './Gpx2Track.js';
import type { Segment, TrackPoint } from './Track.js';
import { Track } from './Track.js';
import { writeTrack } from './trackWriteHelpers.js';



async function processGpxFile(
  fileBuffer: Buffer,
  fileName: string,
  database: string,
  schema: string,
) {

  const gpx2t = new Gpx2Track(fileBuffer.toString('utf-8'))

  // check if gpx file
  const numTracks = gpx2t.numTracks()
  if (numTracks < 1) {
    console.error(`Could not find any track in gpx file ${fileName} `)
  }

  const metadataStartTime = gpx2t.extractStartTimeFromMetadata()
  const trackSegmentPoints = gpx2t.getExtendedSegments()


  // Iterate over tracks
  for (let trackNum = 0; trackNum < numTracks; trackNum++) {

    // extract metadata for track
    const tm = gpx2t.trackMetadata(trackNum)
    const { name, ascent, time, timelength } = tm
    const startTime = time ?? metadataStartTime

    const track = new Track({
      name,
      source: fileName,
      totalAscent: ascent,
      startTime: startTime ?? new Date(),
      durationSeconds: timelength
    })

    const extSegments = trackSegmentPoints[trackNum]
    for (const extSegment of extSegments) {

      const { positionList, timeStringList } = extSegment
      const segment: Segment = []
      for (let segPointNum = 0; segPointNum < positionList.length; segPointNum++) {
        const timeString = timeStringList[segPointNum]
        const point_time = timeString ? new Date(timeString) : undefined
        const position = positionList[segPointNum]
        const tp: TrackPoint = {
          lon: position[0],
          lat: position[1],
          elevation: position[2],
          point_time
        }
        segment.push(tp)
      }
      track.addSegment(segment)
    }
    await writeTrack({
      fileBuffer,
      database,
      schema,
      track
    })
  }
}

export { processGpxFile };

