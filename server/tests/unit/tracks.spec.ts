import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

import * as pg from 'pg';
import request from 'supertest';

import app from '../../src/app.js';
import getSchema from '../../src/lib/getSchema.js';
import { isAuthenticated } from '../../src/routes/auth/auth.js';

vi.mock('../../src/routes/auth/auth');
vi.mock('../../src/lib/getSchema.js')

const mockedIsAuthenticated = vi.mocked(isAuthenticated);
const mockGetSchema = vi.mocked(getSchema)
const { Pool } = pg

const mockTrack1 = {
  id: 2,
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: new Date('2020-01-01T11:11:11.011Z'),
  ascent: 3,
};

const mockTrack2 = {
  id: 7,
  name: 'trackseven',
  length: 44.5,
  src: 'sevensrc',
  time: new Date('2027-01-01T11:11:11.011Z'),
  ascent: 3,
};

describe('Endpoints related to track metadata', () => {

  const mockQuery = vi.fn<() => Promise<any>>(() => Promise.resolve("initial"))

  beforeAll(() => {
    const MockedPool = vi.mocked(pg.Pool, { deep: true })
    MockedPool.mock.instances.forEach((poolInstance) => {
      const tmpMock = vi.mocked(poolInstance.query)
      tmpMock.mockImplementation(() => mockQuery())
    })
  })
  beforeEach(() => {
    mockGetSchema.mockReset();
    mockQuery.mockReset();

    // disable the authentication
    mockedIsAuthenticated.mockImplementation((req: any, res: any, next: any): any => {
      next();
    });
  });

  test('GET happy path', async () => {
    mockQuery.mockResolvedValue({ rows: [mockTrack1] });
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/tracks/byid/123/sid/correct')
      .expect(200);

    expect(response.body).toEqual({ ...mockTrack1, time: mockTrack1.time.toISOString() });
    expect(mockGetSchema).toHaveBeenCalled();
  });

  test('GET is sid validation active', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .get('/api/tracks/byid/123/sid/1-2')
      .expect(401);
  });

  test('GET missing track id', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .get('/api/tracks/byid//sid/correct')
      .expect(404);
  });

  test('GET missing track id 2', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .get('/api/tracks/byid/sid/correct')
      .expect(404);
  });

  test('GET wrong track id format', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .get('/api/tracks/byid/abc/sid/correct')
      .expect(400);
  });

  test('Update Track 200', async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });
    mockGetSchema.mockResolvedValue('myschema');

    await request(app)
      .put('/api/tracks/byid/88/sid/abcsid')
      .send(
        {
          data: { name: 'newname' },
          updateAttributes: ['name'],
        },
      )
      .expect(200);
  });

  test('Update Track 500', async () => {
    mockQuery.mockResolvedValue({ rowCount: 0 });
    mockGetSchema.mockResolvedValue('myschema');

    await request(app)
      .put('/api/tracks/byid/88/sid/abcsid')
      .send(
        {
          data: { name: 'newname' },
          updateAttributes: ['name'],
        },
      )
      .expect(404);
  });

  test('Delete Track 200', async () => {
    mockQuery.mockResolvedValue({ rowCount: 1 });
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .delete('/api/tracks/byid/88/sid/abcsid')
      .expect(200);
  });

  test('Delete Track 500', async () => {
    mockQuery.mockResolvedValue({ rowCount: 0 });
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .delete('/api/tracks/byid/88/sid/abcsid')
      .expect(404);
  });

  test('Get list of tracks', async () => {
    mockQuery.mockResolvedValue({ rows: [mockTrack1, mockTrack2] });
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .post('/api/tracks/bylist/sid/correct')
      .set('Content-Type', 'application/json')
      .send(
        [2, 7]
      )
      .expect(200);

    expect(response.body).toEqual([
      { ...mockTrack1, time: mockTrack1.time.toISOString() },
      { ...mockTrack2, time: mockTrack2.time.toISOString() }
    ]
    );
    expect(mockGetSchema).toHaveBeenCalled();
    //    expect(mockQuery).toHaveBeenCalledTimes(2); // why?
    //    expect(mockQuery).toHaveBeenNthCalledWith(
    // 2,
    //   'SELECT id, name, length, src, time, ascent FROM myschema.tracks WHERE id = ANY($1::int[])',
    //   [[2, 7]],
    // );
  });

  test('Get list of ids', async () => {
    const testArray = [-11, 4, 7, 9]
    mockQuery.mockResolvedValue(
      {
        rows: testArray.map((id) => ({ id }))
      }
    );
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .post('/api/tracks/idlist/byextentbytime/sid/correct')
      .set('Content-Type', 'application/json')
      .send(testArray)
      .expect(200);

    expect(response.body).toEqual(testArray);
    expect(mockGetSchema).toHaveBeenCalled();
  });

});
