import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import app from '../../src/app.js';

import * as pg from 'pg';
import request from 'supertest';

import getSchema from '../../src/lib/getSchema.js';
vi.mock('../../src/lib/getSchema.js')

const { Pool } = pg


const mockGetSchema = vi.mocked(getSchema)

vi.mock('pg', () => {
  const mClient = {
    connect: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  const Pool = vi.fn(() => mClient);
  return { default: { Pool }, Pool };
});

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3,
};

describe('tracks - byYear', () => {
  let mockPool: any;
  beforeEach(() => {
    mockGetSchema.mockReset();
    mockPool = new Pool();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  test('happy path', async () => {
    mockPool.query.mockResolvedValue({ rows: [mockTrack1] });
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
