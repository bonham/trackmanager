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

const mockGetSchema = vi.mocked(getSchema)
const dbMockResult = {
  rows: [
    {
      id: 7,
    },
    {
      id: 9,
    },
    {
      id: 22
    }
  ]
}
const expectedResult = [7, 9, 22]

describe('trackids - byYear', () => {

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
    mockQuery.mockResolvedValue(dbMockResult);
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/tracks/ids/byyear/2021/sid/correct')
      .expect(200);

    expect(response.body).toEqual(expectedResult);
    expect(mockGetSchema).toHaveBeenCalled();
  });
  test('sid not alphanum', async () => {
    mockGetSchema.mockResolvedValue(null);
    await request(app)
      .get('/api/tracks/ids/byyear/2021/sid/2-3')
      .expect(401);
  });

  test('wrong year format', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .get('/api/tracks/ids/byyear/A2021/sid/correct')
      .expect(400);
  });
});
