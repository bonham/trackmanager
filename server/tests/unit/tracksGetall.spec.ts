import pg from 'pg';
import request from 'supertest';

import app from '../../src/app.js';
import getSchema from '../../src/lib/getSchema.js';
import { isAuthenticated } from '../../src/routes/auth/auth.js';

jest.mock('../../src/routes/auth/auth');
jest.mock('../../src/lib/getSchema.js')


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dummy = isAuthenticated;

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3,
};


const mockGetSchema = jest.mocked(getSchema)

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn().mockResolvedValue([77]),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mClient) };
});
const mockedPg = jest.mocked(pg)



describe('tracks - getall', () => {

  beforeEach(() => {
    mockGetSchema.mockReset()

    const pool = new pg.Pool()
    const mockedPool = jest.mocked(pool)
    mockedPool.query.mockImplementation((...args: any): any => {
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
