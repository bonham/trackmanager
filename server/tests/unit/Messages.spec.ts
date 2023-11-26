import type { EventFitMessage } from '@garmin/fitsdk';


import fs from 'node:fs';
import {
  RecordMessage, RecordMessageList,
  StartStopList,
  concatRecordMessageLists,
} from '../../src/lib/fit/Messages.js';

test('interval', () => {
  fs.readFile(
    './fitsdk1.json',
    { encoding: 'utf-8' },
    (err, jsonString) => {
      if (err) throw err;

      const messages = JSON.parse(jsonString);
      const eventMessages = messages.eventMesgs as EventFitMessage[];

      const eventMesgs = new StartStopList(eventMessages);
      const intervals = eventMesgs.getIntervals();

      expect(intervals.length).toBeGreaterThan(0);
      const firstInt = intervals[0];
      expect(firstInt[0]).toEqual('2023-10-08T08:08:17.000Z');
      expect(firstInt[1]).toEqual('2023-10-08T08:08:17.000Z');
    },
  );
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
