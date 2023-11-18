/* eslint-disable @typescript-eslint/indent */
import { DateTime } from 'luxon';
import { RecordMessageList } from './Messages';
import type { DateTimeInterval } from './types';

/**
 * Return index of next matching interval. Returns undefined if no matching interval found
 * Match is : element bigger than left side of interval and smaller or equal right side
 *
 * @param startIdx index on which interval to start to search for
 * @param timestamp timestamp to checkif it is in interval
 * @param intervals *sorted* list of intervals
 */
function nextMatchingInterval(
  startIdx: number,
  timestamp: DateTime,
  intervals: DateTimeInterval[],
) {
  for (let i = startIdx; i < intervals.length; i += 1) {
    // timestamp smaller than interval
    if (timestamp < intervals[i][0]) {
      return undefined;
    }
    // timestamp is in interval
    if ((timestamp >= intervals[i][0]) && (timestamp <= intervals[i][1])) {
      return i;
    }
    // timestamp could be in next interval
  }
  // no interval found
  return undefined;
}

function intersectRecordMessages(
  bMessages: RecordMessageList,
  startStopIntervals: DateTimeInterval[],
): {
  found: { [index: string]: RecordMessageList },
  notfound: RecordMessageList[]
} {
  const msgResult: {
    [index: string]: RecordMessageList
  } = {}; // found interval indexes could be sparse
  const msgNotFound: RecordMessageList[] = [];

  let intervalStartSearchIdx = 0;
  let notFoundSegmentIdx = 0;

  // loop over timestamps
  bMessages.messages.forEach((m) => {
    const ts = m.getDateTime();

    // search for next interval containing ts, starting with interval
    const matchingIntervalIdx = nextMatchingInterval(
      intervalStartSearchIdx,
      ts,
      startStopIntervals,
    );

    // undefined: ts is smaller than where the search starts ->
    // point is before first interval in search list
    if (matchingIntervalIdx === undefined) {
      // remember in notfound list
      if (!msgNotFound[notFoundSegmentIdx]) {
        msgNotFound[notFoundSegmentIdx] = new RecordMessageList([]);
      }
      msgNotFound[notFoundSegmentIdx].addMessage(m);
    } else {
      // point was found
      // move search start if needed
      intervalStartSearchIdx = matchingIntervalIdx;
      notFoundSegmentIdx = matchingIntervalIdx + 1;

      if (!msgResult[matchingIntervalIdx]) {
        msgResult[matchingIntervalIdx] = new RecordMessageList([]);
      }
      msgResult[matchingIntervalIdx].addMessage(m);
    }
  });

  return { found: msgResult, notfound: msgNotFound };
}

export { intersectRecordMessages };

