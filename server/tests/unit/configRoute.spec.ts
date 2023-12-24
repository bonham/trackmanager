import pg from 'pg';
import request from 'supertest';

import app from '../../src/app.js';
import getSchema from '../../src/lib/getSchema.js';
import { isAuthenticated } from '../../src/routes/auth/auth.js';

jest.mock('../../src/routes/auth/auth');
jest.mock('../../src/lib/getSchema.js')


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dummy = isAuthenticated;

const mockGetSchema = jest.mocked(getSchema)

jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn().mockResolvedValue([77]),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mClient) };
});

describe('get config', () => {

  const expectedconfigvalue = "MYCONFIGVALUE"

  beforeEach(() => {
    mockGetSchema.mockReset()

    const pool = new pg.Pool()
    const mockedPool = jest.mocked(pool)
    const mockQuery = jest.fn().mockResolvedValueOnce({
      rows: [{ exists: true }],
      rowCount: 1
    }).mockResolvedValueOnce({
      rows: [{ value: expectedconfigvalue }],
      rowCount: 1
    })
    mockedPool.query = mockQuery

  });
  test('config1', async () => {
    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype/anyconfigkey')
      .expect(200);

    expect(response.body).toEqual({ value: expectedconfigvalue })
  });
});
