import type { RecordFitMessage } from '@garmin/fitsdk';
import { DateTime } from 'luxon';
import { RecordMessageList } from '../../src/lib/fit/Messages';
import { intersectRecordMessages } from '../../src/lib/fit/intersect';
import type { DateTimeInterval } from '../../src/lib/fit/types';

test('intersect', () => {
  const startStopIntervals: DateTimeInterval[] = [
    [DateTime.fromISO('2023-10-08T11:10:00.000Z'), DateTime.fromISO('2023-10-08T11:15:00.000Z')],
    [DateTime.fromISO('2023-10-08T11:20:00.000Z'), DateTime.fromISO('2023-10-08T11:21:00.000Z')],
    [DateTime.fromISO('2023-10-08T11:30:00.000Z'), DateTime.fromISO('2023-10-08T11:35:00.000Z')],
  ];
  const timestamps: DateTime[] = [
    DateTime.fromISO('2023-10-08T11:09:00.000Z'), // out
    DateTime.fromISO('2023-10-08T11:10:00.000Z'), // in 0
    DateTime.fromISO('2023-10-08T11:14:00.000Z'), // in 0
    DateTime.fromISO('2023-10-08T11:15:00.000Z'), // in 0
    DateTime.fromISO('2023-10-08T11:16:00.000Z'), // out
    DateTime.fromISO('2023-10-08T11:32:00.000Z'), // in 1
  ];

  const recordFitMsgs: RecordFitMessage[] = timestamps.map((t) => ({
    temperature: 1,
    grade: 2,
    altitude: 3,
    speed: 4,
    positionLat: 5,
    positionLong: 6,
    distance: 7,
    enhancedAltitude: 8,
    enhancedSpeed: 9,
    timestamp: t.toJSDate(),
  }));
  const bMsgList = RecordMessageList.fromFitMessages(recordFitMsgs);

  const segments = intersectRecordMessages(bMsgList, startStopIntervals);

  const { found } = segments;
  const notFound = segments.notfound;

  // number of segments
  expect(Object.keys(found).length).toEqual(2);

  // first segment
  const firstSeg = found[0];
  expect(firstSeg.messages.length).toEqual(3);

  // segment with idx 1 - not available
  const secSeg = found[1];
  expect(secSeg).toBeUndefined();

  // first segment
  const thirdSeg = found[2];
  expect(thirdSeg.messages.length).toEqual(1);

  // notfound
  expect(notFound.length).toEqual(2);
});
