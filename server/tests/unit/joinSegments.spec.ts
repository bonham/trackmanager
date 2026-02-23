import type { RecordFitMessage } from '@garmin/fitsdk';
import { describe, expect, test } from 'vitest';
import { RecordMessage, RecordMessageList } from '../../src/lib/fit/Messages.js';
import { joinSegments } from '../../src/lib/fit/joinSegments.js';

// Garmin stores lat/lon in semicircles: degrees * 11930465
const GARMIN_FACTOR = 11930465;

function makeRecordMessage(lat: number, lon: number, timestampOffset = 0): RecordMessage {
  const fitMsg: RecordFitMessage = {
    positionLat: Math.round(lat * GARMIN_FACTOR),
    positionLong: Math.round(lon * GARMIN_FACTOR),
    altitude: 100,
    timestamp: new Date(1000000 + timestampOffset * 1000),
    enhancedAltitude: 100,
    enhancedSpeed: 5,
    speed: 5,
    distance: 0,
    grade: 0,
    temperature: 20,
  };
  return new RecordMessage(fitMsg);
}

function makeSegment(points: Array<[number, number]>, timeOffset = 0): RecordMessageList {
  const messages = points.map(([lat, lon], i) =>
    makeRecordMessage(lat, lon, timeOffset + i)
  );
  return new RecordMessageList(messages);
}

// Freiburg im Breisgau area points
const lat0 = 47.9959; // Freiburg
const lon0 = 7.8494;

describe('joinSegments', () => {
  test('returns empty array when given empty list', () => {
    expect(joinSegments(10, [])).toEqual([]);
  });

  test('returns single segment unchanged when only one segment', () => {
    const seg = makeSegment([[lat0, lon0], [lat0 + 0.0001, lon0]], 0);
    const result = joinSegments(10, [seg]);
    expect(result).toHaveLength(1);
    expect(result[0].length).toBe(2);
  });

  test('joins two segments when end/start are within maxDist', () => {
    // Create two segments where end of first is ~1m from start of second
    // 0.00001 degree lat ≈ 1.11m at equator
    const seg1 = makeSegment(
      [[lat0, lon0], [lat0 + 0.00001, lon0]],
      0
    );
    // Start of seg2 is very close to end of seg1 (same point essentially)
    const seg2 = makeSegment(
      [[lat0 + 0.00001, lon0], [lat0 + 0.00002, lon0]],
      10
    );
    const result = joinSegments(10, [seg1, seg2]);
    // Should be joined into one segment
    expect(result).toHaveLength(1);
    expect(result[0].length).toBe(4);
  });

  test('keeps two segments separate when end/start are beyond maxDist', () => {
    // Create two segments 1km apart (0.01 degree ≈ 1.1km)
    const seg1 = makeSegment(
      [[lat0, lon0], [lat0 + 0.001, lon0]],
      0
    );
    const seg2 = makeSegment(
      [[lat0 + 0.02, lon0], [lat0 + 0.03, lon0]],
      20
    );
    const result = joinSegments(10, [seg1, seg2]);
    expect(result).toHaveLength(2);
    expect(result[0].length).toBe(2);
    expect(result[1].length).toBe(2);
  });

  test('chains three segments: first two close (join), third far (keep separate)', () => {
    const seg1 = makeSegment([[lat0, lon0], [lat0 + 0.000005, lon0]], 0);
    // very close to end of seg1
    const seg2 = makeSegment([[lat0 + 0.000005, lon0], [lat0 + 0.00001, lon0]], 10);
    // far from end of seg2
    const seg3 = makeSegment([[lat0 + 0.5, lon0], [lat0 + 0.6, lon0]], 20);

    const result = joinSegments(10, [seg1, seg2, seg3]);
    expect(result).toHaveLength(2);
    expect(result[0].length).toBe(4);
    expect(result[1].length).toBe(2);
  });

  test('chains three segments: all far apart (keep three segments)', () => {
    const seg1 = makeSegment([[lat0, lon0], [lat0 + 0.001, lon0]], 0);
    const seg2 = makeSegment([[lat0 + 0.1, lon0], [lat0 + 0.101, lon0]], 10);
    const seg3 = makeSegment([[lat0 + 0.5, lon0], [lat0 + 0.501, lon0]], 20);

    const result = joinSegments(10, [seg1, seg2, seg3]);
    expect(result).toHaveLength(3);
  });

  test('throws when current segment is empty (getMessage returns undefined)', () => {
    const seg1 = makeSegment([[lat0, lon0], [lat0 + 0.001, lon0]], 0);
    const emptySeg = new RecordMessageList([]);
    expect(() => joinSegments(10, [seg1, emptySeg])).toThrow('Start of current segment did not contain element');
  });

  test('throws when last segment is empty (getLastMessage returns undefined)', () => {
    const emptySeg = new RecordMessageList([]);
    const seg2 = makeSegment([[lat0 + 0.1, lon0], [lat0 + 0.101, lon0]], 10);
    // inSegments.shift() takes emptySeg as lastSegment; then seg2 becomes currentSegment
    // endOfLastSeg (emptySeg.getLastMessage()) will be undefined
    expect(() => joinSegments(10, [emptySeg, seg2])).toThrow('End of last segment did not contain element');
  });
});
