/* eslint-disable no-continue */
import geodesic from 'geographiclib-geodesic';
import { RecordMessageList, concatRecordMessageLists } from './Messages';

const geod = geodesic.Geodesic.WGS84;



/**
 * Joins geodata segments if gps points are close enough.
 *
 * @param dist Maximum distance in meters for joining two consecutive segments
 * @param inSegments List of list of points
 * @returns List of list of points
 */
export function joinSegments(
  maxDist: number,
  inSegments: RecordMessageList[],
): RecordMessageList[] {
  const joinedSegments: RecordMessageList[] = [];

  // move first segment from input to output
  // const firstSeg = inSegments.shift()
  // if (firstSeg === undefined) {
  //   return []
  // }
  // joinedSegments.push(firstSeg)
  let lastSegment = inSegments.shift();
  if (lastSegment === undefined) { return []; }

  let currentSegment: RecordMessageList | undefined;
  while (inSegments.length > 0) {
    currentSegment = inSegments.shift();
    if (lastSegment === undefined) throw Error('Lastsegment is unexpectedly undefined');
    if (currentSegment === undefined) throw Error('Current segment is unexpectedly undefined');

    // there is no next
    if (currentSegment === undefined) {
      joinedSegments.push(lastSegment);
      return joinedSegments;
    }

    // there is a next - last is also defined
    const startOfCurrentSeg = currentSegment.getMessage(0);
    if (startOfCurrentSeg === undefined) {
      throw Error('Start of current segment did not contain element');
    }
    const endOfLastSeg = lastSegment.getLastMessage();
    if (endOfLastSeg === undefined) {
      throw Error('End of last segment did not contain element');
    }

    const [lat1, lon1] = endOfLastSeg.getLatLon();
    const [lat2, lon2] = startOfCurrentSeg.getLatLon();
    const r = geod.Inverse(lat1, lon1, lat2, lon2);

    if (r.s12 === undefined) {
      throw Error(
        'Could not calculate distance between two latlon points. ',
        { cause: [lat1, lon1, lat2, lon2] },
      );
    } // STOP

    const dist = r.s12;
    // console.log("Dist (m)" + dist.toFixed(2))

    if (dist <= maxDist) {
      // concat the segments
      lastSegment = concatRecordMessageLists(lastSegment, currentSegment);

      continue;
    } else {
      // wrap up last segment
      joinedSegments.push(lastSegment);

      // get new
      lastSegment = currentSegment;
      continue;
    }
  }
  joinedSegments.push(lastSegment);
  return joinedSegments; // never reached, but satisfy typescript
}
