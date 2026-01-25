import type { EventFitMessage } from '@garmin/fitsdk';
import { DateTime } from 'luxon';
import { expect, test } from 'vitest';



import {
  RecordMessage, RecordMessageList,
  StartStopList,
  concatRecordMessageLists,
} from '../../src/lib/fit/Messages.js';


test('interval', () => {

  const eventMessages: EventFitMessage[] =
    [
      {
        "timestamp": new Date("2023-10-08T08:08:17.000Z"),
        "event": "timer",
        "eventType": "start",
        "data": 0,
        "timerTrigger": "manual"
      },
      {
        "timestamp": new Date("2023-10-08T08:08:17.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T08:08:18.000Z"),
        "event": "timer",
        "eventType": "start",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T08:08:18.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T08:08:59.000Z"),
        "event": "timer",
        "eventType": "start",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T08:09:22.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T12:54:47.000Z"),
        "event": "timer",
        "eventType": "start",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T12:54:50.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T12:54:56.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 0,
        "timerTrigger": "manual"
      },
      {
        "timestamp": new Date("2023-10-08T14:08:22.000Z"),
        "event": "timer",
        "eventType": "start",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T14:08:26.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 1,
        "timerTrigger": "auto"
      },
      {
        "timestamp": new Date("2023-10-08T14:08:52.000Z"),
        "event": "timer",
        "eventType": "stopAll",
        "data": 0,
        "timerTrigger": "manual"
      }
    ]

  // start of test

  const eventMesgs = new StartStopList(eventMessages);
  const intervals = eventMesgs.getIntervals();

  expect(intervals.length).toBeGreaterThan(0);
  const firstInt = intervals[0];
  expect(firstInt[0]).toEqual(DateTime.fromISO('2023-10-08T08:08:17.000Z'));
  expect(firstInt[1]).toEqual(DateTime.fromISO('2023-10-08T08:08:17.000Z'));
});

test('type1', () => {
  const rm1 = new RecordMessage({
    temperature: 1,
    grade: 2,
    altitude: 3,
    speed: 4,
    positionLat: 5,
    positionLong: 6,
    distance: 7,
    enhancedAltitude: 8,
    enhancedSpeed: 9,
    timestamp: new Date(),
  });
  const rm2 = new RecordMessage({
    temperature: 10,
    grade: 20,
    altitude: 30,
    speed: 40,
    positionLat: 50,
    positionLong: 60,
    distance: 70,
    enhancedAltitude: 80,
    enhancedSpeed: 90,
    timestamp: new Date(),
  });

  const fitM = rm1.getFitMessage(); // typeof RecordFitMessage
  expect(fitM.speed).toEqual(4);

  const recMsgList = new RecordMessageList([rm1, rm2]);
  const recordMessage1 = recMsgList.getMessage(0); // RecordMessage
  expect(recordMessage1).toBeInstanceOf(RecordMessage);

  const msg = recordMessage1!.getFitMessage(); // RecordFitmessage
  expect(msg.temperature).toEqual(1);

  const msgs = recMsgList.getFitMessages(); // RecordMessage[]
  expect(msgs[1].enhancedSpeed).toEqual(90);
});

test('concat', () => {
  const rm1 = new RecordMessage({
    temperature: 1,
    grade: 2,
    altitude: 3,
    speed: 4,
    positionLat: 5,
    positionLong: 6,
    distance: 7,
    enhancedAltitude: 8,
    enhancedSpeed: 9,
    timestamp: new Date(),
  });
  const rm2 = new RecordMessage({
    temperature: 10,
    grade: 20,
    altitude: 30,
    speed: 40,
    positionLat: 50,
    positionLong: 60,
    distance: 70,
    enhancedAltitude: 80,
    enhancedSpeed: 90,
    timestamp: new Date(),
  });
  const rm3 = new RecordMessage({
    temperature: 100,
    grade: 2,
    altitude: 3,
    speed: 4,
    positionLat: 5,
    positionLong: 6,
    distance: 7,
    enhancedAltitude: 8,
    enhancedSpeed: 9,
    timestamp: new Date(),
  });
  const rm4 = new RecordMessage({
    temperature: 1000,
    grade: 20,
    altitude: 30,
    speed: 40,
    positionLat: 50,
    positionLong: 60,
    distance: 70,
    enhancedAltitude: 80,
    enhancedSpeed: 90,
    timestamp: new Date(),
  });

  const rml1 = new RecordMessageList([rm1, rm2]);
  const rml2 = new RecordMessageList([rm3, rm4]);
  const conc = concatRecordMessageLists(rml1, rml2);
  expect(conc.length).toEqual(4);
  expect(conc.getMessage(3)).toBeDefined();
  expect(conc.getMessage(3)!.getFitMessage().temperature).toEqual(1000);
});
