import { describe, expect, test } from 'vitest';
import type { TrackPoint } from '../../src/lib/Track.js';
import { Track } from '../../src/lib/Track.js';

const segment1: TrackPoint[] = [
  {
    lat: 47.76429734968491,
    lon: 7.578611980957021,
    elevation: 100,
  },
  {
    lat: 47.77168410179024,
    lon: 7.580211463581179,
    elevation: 150,
  },
  {
    lat: 47.78548376605252,
    lon: 7.58903441612091,
    elevation: 140,
  },
];

const segment2: TrackPoint[] = [
  {
    lat: 47.815184874551306,
    lon: 7.612803497030228,
    elevation: 200,
  },
  {
    lat: 7.628276091173092,
    lon: 47.81162947796335,
    elevation: 215,
  },
];



describe('Track Object', () => {
  test('Simple1', () => {
    const t1 = new Track({
      name: 'First Track',
      source: 'From source',
      totalAscent: 233,
      totalDistance: 566,
      startTime: new Date('2027-01-01T01:15:00.000'),
    });
    t1.addSegment(segment1);
    t1.addSegment(segment2);
    expect(t1.getMetaData().name).toEqual('First Track');
    expect(t1.getSegments().length).toEqual(2);
  });

  test('setSegmentList replaces segments', () => {
    const t = new Track({ startTime: new Date('2024-01-01') });
    t.addSegment(segment1);
    t.setSegmentList([segment2]);
    expect(t.getSegments().length).toEqual(1);
    expect(t.getSegments()[0]).toEqual(segment2);
  });

  test('getStartTime returns the initial start time', () => {
    const start = new Date('2024-06-15T10:00:00.000Z');
    const t = new Track({ startTime: start });
    expect(t.getStartTime()).toEqual(start);
  });

  test('setStartTime updates the start time', () => {
    const initialDate = new Date('2024-01-01T00:00:00.000Z');
    const newDate = new Date('2024-06-15T10:00:00.000Z');
    const t = new Track({ startTime: initialDate });
    t.setStartTime(newDate);
    expect(t.getStartTime()).toEqual(newDate);
  });

  test('empty segments list initially', () => {
    const t = new Track({ startTime: new Date() });
    expect(t.getSegments()).toEqual([]);
  });
});

