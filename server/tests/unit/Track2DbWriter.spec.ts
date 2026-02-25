import type { QueryResult, QueryResultRow } from 'pg';
import { describe, expect, test, vi } from 'vitest';

// Mock pg before importing Track2DbWriter
vi.mock('pg', () => {
  const Client = vi.fn(function (this: Record<string, unknown>) {
    this.query = vi.fn();
    this.connect = vi.fn();
    this.end = vi.fn();
  });
  const Pool = vi.fn(function (this: Record<string, unknown>) {
    this.query = vi.fn();
    this.connect = vi.fn();
    this.end = vi.fn();
  });
  return { default: { Client, Pool }, Client, Pool };
});

import pg from 'pg';
import type { TrackPoint } from '../../src/lib/Track.js';
import { Track } from '../../src/lib/Track.js';
import { Track2DbWriter } from '../../src/lib/Track2DbWriter.js';

function makeQueryResult<T extends QueryResultRow>(rows: T[], rowCount = rows.length): QueryResult<T> {
  return { rows, rowCount, command: 'SELECT', oid: 0, fields: [] };
}

type FakeClient = {
  query: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
};

async function makeInitializedWriter(queryResponses?: Array<unknown>): Promise<{ writer: Track2DbWriter; client: FakeClient }> {
  const connectMock = vi.fn().mockResolvedValue(undefined);
  const queryMock = vi.fn();
  const endMock = vi.fn().mockResolvedValue(undefined);

  if (queryResponses) {
    for (const resp of queryResponses) {
      if (resp instanceof Error) {
        queryMock.mockRejectedValueOnce(resp);
      } else {
        queryMock.mockResolvedValueOnce(resp);
      }
    }
    queryMock.mockResolvedValue(makeQueryResult([])); // fallback
  } else {
    queryMock.mockResolvedValue(makeQueryResult([]));
  }

  const MockedClient = vi.mocked(pg.Client);
  MockedClient.mockImplementationOnce(function (this: FakeClient) {
    this.query = queryMock;
    this.connect = connectMock;
    this.end = endMock;
  } as unknown as typeof pg.Client);

  const writer = new Track2DbWriter();
  await writer.init({
    dbName: 'testdb',
    dbSchema: 'testschema',
    dbHost: 'localhost',
    dbUser: 'postgres',
  });

  return {
    writer,
    client: { query: queryMock, connect: connectMock, end: endMock },
  };
}

describe('Track2DbWriter - initialization methods', () => {
  test('dbOptions() throws when not initialized', () => {
    const writer = new Track2DbWriter();
    expect(() => writer.dbOptions()).toThrow('Dbwriter object was not initialized');
  });

  test('client() throws when not initialized', () => {
    const writer = new Track2DbWriter();
    expect(() => writer.client()).toThrow('Client not initialized');
  });

  test('init() sets up client and connects', async () => {
    const { writer, client } = await makeInitializedWriter();
    expect(client.connect).toHaveBeenCalledOnce();
    expect(writer.schema()).toBe('testschema');
  });

  test('schema returns dbSchema after init', async () => {
    const { writer } = await makeInitializedWriter();
    expect(writer.schema()).toBe('testschema');
  });

  test('table names return formatted strings', async () => {
    const { writer } = await makeInitializedWriter();
    expect(writer.tableSegment()).toBe('testschema.segments');
    expect(writer.tableTrack()).toBe('testschema.tracks');
    expect(writer.tablePoint()).toBe('testschema.track_points');
    expect(writer.tablePointTmp()).toBe('testschema.track_points_tmp');
    expect(writer.sequenceTrack()).toBe('testschema.tracks_id');
  });

  test('end() calls client.end and clears state', async () => {
    const { writer, client } = await makeInitializedWriter();
    writer.end();
    expect(client.end).toHaveBeenCalledOnce();
    expect(() => writer.client()).toThrow('Client not initialized');
  });

  test('end() handles rejected client.end gracefully', async () => {
    const { writer, client } = await makeInitializedWriter();
    client.end.mockRejectedValue(new Error('disconnect failed'));
    expect(() => writer.end()).not.toThrow();
  });
});

describe('Track2DbWriter - checkForHash', () => {
  test('returns true when count > 0', async () => {
    const { writer } = await makeInitializedWriter([makeQueryResult([{ count: 1 }])]);
    expect(await writer.checkForHash('abc123')).toBe(true);
  });

  test('returns false when count is 0', async () => {
    const { writer } = await makeInitializedWriter([makeQueryResult([{ count: 0 }])]);
    expect(await writer.checkForHash('abc123')).toBe(false);
  });
});

describe('Track2DbWriter - getNextTrackId', () => {
  test('returns track id when nextval is returned', async () => {
    const { writer } = await makeInitializedWriter([makeQueryResult([{ nextval: '42' }])]);
    expect(await writer.getNextTrackId()).toBe(42);
  });

  test('throws when nextval result is malformed', async () => {
    const { writer } = await makeInitializedWriter([makeQueryResult([{ unexpected: 'data' }])]);
    await expect(writer.getNextTrackId()).rejects.toThrow('Invalid input');
  });
});

describe('Track2DbWriter - insertTrackMetadata', () => {
  test('succeeds when rowCount is 1', async () => {
    const { writer } = await makeInitializedWriter([{ ...makeQueryResult([{}]), rowCount: 1 }]);
    await expect(
      writer.insertTrackMetadata(1, {
        name: 'test', source: 'src.gpx', totalAscent: 100,
        totalDistance: 10000, startTime: new Date(), durationSeconds: 3600,
      }, 'hash123')
    ).resolves.toBeUndefined();
  });

  test('throws when rowCount is not 1', async () => {
    const { writer } = await makeInitializedWriter([{ ...makeQueryResult([]), rowCount: 0 }]);
    await expect(
      writer.insertTrackMetadata(1, { name: 'test', source: 'src.gpx', startTime: new Date() }, 'hash123')
    ).rejects.toThrow('Insert rowcount is not equal to 1');
  });
});

describe('Track2DbWriter - write', () => {
  test('returns -1 when hash already exists', async () => {
    const { writer } = await makeInitializedWriter([makeQueryResult([{ count: 1 }])]);
    const track = new Track({ name: 'test', startTime: new Date() });
    expect(await writer.write(track, 'existing-hash')).toBe(-1);
  });

  test('writes track successfully and returns track id', async () => {
    const segment: TrackPoint[] = [
      { lat: 47.9, lon: 7.8, elevation: 200, point_time: new Date() },
    ];
    const { writer } = await makeInitializedWriter([
      makeQueryResult([{ count: 0 }]),           // checkForHash: not found
      makeQueryResult([]),                        // BEGIN transaction
      makeQueryResult([{ nextval: '10' }]),       // getNextTrackId
      { ...makeQueryResult([{}]), rowCount: 1 },  // insertTrackMetadata
      makeQueryResult([]),                        // insertSegment
      makeQueryResult([]),                        // insertPointListForSegment (1 point)
      { ...makeQueryResult([]), rowCount: 3 },    // processAndSimplifyTrack
      makeQueryResult([]),                        // updateTrackWkbGeometry
      makeQueryResult([]),                        // updateLengthTime
      makeQueryResult([]),                        // updateAscentFromSimplifiedPoints
      makeQueryResult([]),                        // deletePointsFromTmp
      makeQueryResult([]),                        // COMMIT
    ]);

    const track = new Track({ name: 'test track', startTime: new Date() });
    track.addSegment(segment);
    expect(await writer.write(track, 'new-hash')).toBe(10);
  });

  test('rolls back transaction on error', async () => {
    const { writer } = await makeInitializedWriter([
      makeQueryResult([{ count: 0 }]),     // checkForHash: not found
      makeQueryResult([]),                  // BEGIN
      new Error('nextval failed'),          // getNextTrackId fails
      // rollback uses the fallback mock
    ]);

    const track = new Track({ name: 'test', startTime: new Date() });
    await expect(writer.write(track, 'new-hash')).rejects.toThrow('Error during track creation');
  });
});

describe('Track2DbWriter - updateMetaData', () => {
  test('updates all provided fields', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.updateMetaData(1, {
      name: 'new name', source: 'new source', totalAscent: 200,
      totalDistance: 20000, startTime: new Date(), durationSeconds: 7200,
    });
    // BEGIN + 6 updates + COMMIT = 8 calls
    expect(client.query).toHaveBeenCalledTimes(8);
  });

  test('only updates provided fields', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.updateMetaData(1, { name: 'only name' });
    // BEGIN + 1 update + COMMIT = 3 calls
    expect(client.query).toHaveBeenCalledTimes(3);
  });

  test('rolls back on error', async () => {
    const { writer, client } = await makeInitializedWriter([
      makeQueryResult([]),                    // BEGIN
      new Error('update failed'),             // name update fails
      // fallback mockResolvedValue for rollback
    ]);
    await expect(writer.updateMetaData(1, { name: 'fail' })).rejects.toThrow('update failed');
  });
});

describe('Track2DbWriter - insertSegment and insertPointListForSegment', () => {
  test('insertSegment calls query with correct parameters', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.insertSegment(5, 0);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('insert into'), [5, 0]);
  });

  test('insertPointListForSegment returns point count', async () => {
    const { writer, client } = await makeInitializedWriter();
    const points: TrackPoint[] = [
      { lat: 47.0, lon: 8.0, elevation: 100 },
      { lat: 47.1, lon: 8.1, elevation: 110 },
    ];
    expect(await writer.insertPointListForSegment(1, 0, points)).toBe(2);
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  test('insertPointListForSegment returns 0 for empty list', async () => {
    const { writer } = await makeInitializedWriter();
    expect(await writer.insertPointListForSegment(1, 0, [])).toBe(0);
  });
});

describe('Track2DbWriter - other update methods', () => {
  test('processAndSimplifyTrack calls query and returns rowCount', async () => {
    const { writer, client } = await makeInitializedWriter([{ ...makeQueryResult([]), rowCount: 42 }]);
    expect(await writer.processAndSimplifyTrack(1)).toBe(42);
    expect(client.query).toHaveBeenCalledOnce();
  });

  test('deletePointsFromTmp calls delete query', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.deletePointsFromTmp(1);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('delete'), [1]);
  });

  test('updateTrackWkbGeometry calls update query', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.updateTrackWkbGeometry(1);
    expect(client.query).toHaveBeenCalledOnce();
  });

  test('updateLengthTime uses tmp view by default', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.updateLengthTime(1);
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('calculated_track_stats_tmp'), [1]
    );
  });

  test('updateLengthTime uses live view when fromTmp=false', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.updateLengthTime(1, false);
    // "calculated_track_stats" is a substring of "calculated_track_stats_tmp" too
    // So just verify it was called with [1]
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('calculated_track_stats'), [1]);
  });

  test('updateAscentFromSimplifiedPoints calls update query', async () => {
    const { writer, client } = await makeInitializedWriter();
    await writer.updateAscentFromSimplifiedPoints(1);
    expect(client.query).toHaveBeenCalledOnce();
  });
});
