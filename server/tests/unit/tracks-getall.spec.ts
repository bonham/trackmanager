import pg from 'pg'
import request from 'supertest'
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

import app from '../../src/app.js'
import getSchema from '../../src/lib/getSchema.js'

vi.mock('../../src/routes/auth/auth');
vi.mock('../../src/lib/getSchema.js')

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3,
};

const mockGetSchema = vi.mocked(getSchema)

describe('tracks - getall', () => {

  const mockQuery = vi.fn<() => Promise<any>>(() => Promise.resolve("initial"))

  beforeAll(() => {
    const MockedPool = vi.mocked(pg.Pool, { deep: true })
    MockedPool.mock.instances.forEach((poolInstance) => {
      const tmpMock = vi.mocked(poolInstance.query)
      tmpMock.mockImplementation(() => mockQuery())
    })
  })

  beforeEach(() => {
    mockGetSchema.mockReset()
    mockQuery.mockReset()
    mockQuery.mockImplementation((): any => {
      return {
        rows: [mockTrack1]
      }
    })

  });

  test('correctsid', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/tracks/getall/sid/correct')
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body).toEqual(expect.arrayContaining([mockTrack1]));
    expect(mockGetSchema).toHaveBeenCalled();
  });
  test('wrongsid', async () => {
    mockGetSchema.mockResolvedValue(null);
    await request(app).get('/api/tracks/getall/sid/wrong').expect(401);
    expect(mockGetSchema).toHaveBeenCalled();
  });
  test('getall nosid', async () => {
    await request(app)
      .get('/api/tracks/getall')
      .expect(404);
  });
  test('getall nosid 2', async () => {
    await request(app)
      .get('/api/tracks/getall/sid/')
      .expect(404);
  });
  test('getall sid nonalpha', async () => {
    await request(app)
      .get('/api/tracks/getall/sid/a-0')
      .expect(401);
  });
});
