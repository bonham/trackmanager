import * as pg from 'pg';
import request from 'supertest';

import app from '../../src/app.js';
import getSchema from '../../src/lib/getSchema.js';
import { isAuthenticated } from '../../src/routes/auth/auth.js';

jest.mock('../../src/routes/auth/auth');
jest.mock('../../src/lib/getSchema.js')

const mockedIsAuthenticated = jest.mocked(isAuthenticated);


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dummy = isAuthenticated;

const mockGetSchema = jest.mocked(getSchema)

const { Pool } = pg
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mClient) };
});

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3,
};

// eslint-disable-next-line no-unused-vars
// const queryMock = jest
//   .spyOn(Pool.prototype, 'query')
//   .mockResolvedValue({
//     rows: [mockTrack1]
//   })

describe('Track byid', () => {
  let mockPool: any;
  beforeEach(() => {
    mockPool = new Pool();
    mockGetSchema.mockReset();

    // disable the authentication
    mockedIsAuthenticated.mockImplementation((req: any, res: any, next: any): any => {
      next();
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('GET happy path', async () => {
    mockPool.query.mockResolvedValue({ rows: [mockTrack1] });
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/tracks/byid/123/sid/correct')
      .expect(200);

    expect(response.body).toEqual(mockTrack1);
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
    mockPool.query.mockResolvedValue({ rowCount: 1 });
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
    mockPool.query.mockResolvedValue({ rowCount: 0 });
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
    mockPool.query.mockResolvedValue({ rowCount: 1 });
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .delete('/api/tracks/byid/88/sid/abcsid')
      .expect(200);
  });
  test('Delete Track 500', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 0 });
    mockGetSchema.mockResolvedValue('myschema');
    await request(app)
      .delete('/api/tracks/byid/88/sid/abcsid')
      .expect(404);
  });
});
