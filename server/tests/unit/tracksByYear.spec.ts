import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

import app from '../../src/app.js';

import * as pg from 'pg';
import request from 'supertest';

import getSchema from '../../src/lib/getSchema.js';
vi.mock('../../src/lib/getSchema.js')

const { Pool } = pg


const mockGetSchema = vi.mocked(getSchema)

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3,
};

describe('tracks - byYear', () => {

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
    mockQuery.mockReset()
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('happy path', async () => {
    mockQuery.mockResolvedValue({ rows: [mockTrack1] });
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/tracks/byyear/2021/sid/correct')
      .expect(200);

    expect(response.body).toEqual([mockTrack1]);
    expect(mockGetSchema).toHaveBeenCalled();
  });
  test('sid not alphanum', async () => {
    mockGetSchema.mockResolvedValue(null);
    await request(app)
      .get('/api/tracks/byyear/2021/sid/2-3')
      .expect(401);
  });

  test('wrong year format', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .get('/api/tracks/byyear/A2021/sid/correct')
      .expect(400);
  });
});
