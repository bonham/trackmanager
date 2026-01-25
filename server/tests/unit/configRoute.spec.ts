import pg from 'pg';
import request from 'supertest';
import { beforeEach, describe, test, vi } from 'vitest';

import app from '../../src/app.js';
import getSchema from '../../src/lib/getSchema.js';
import { isAuthenticated } from '../../src/routes/auth/auth.js';

vi.mock('../../src/routes/auth/auth');
vi.mock('../../src/lib/getSchema.js')


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dummy = isAuthenticated;

const mockGetSchema = vi.mocked(getSchema)

vi.mock('pg', () => {
  const mClient = {
    connect: vi.fn(),
    query: vi.fn().mockResolvedValue([77]),
    end: vi.fn(),
  };
  const Pool = vi.fn(() => mClient);
  return { default: { Pool }, Pool };
});

const pool = new pg.Pool()
const mockedPool = vi.mocked(pool)

describe('get config', () => {

  const expectedconfigvalue = "MYCONFIGVALUE"

  beforeEach(() => {
    mockGetSchema.mockReset()


  });

  test('config exists', async () => {

    const mockQuery = vi.fn().mockResolvedValueOnce({
      rows: [{ exists: true }],
      rowCount: 1
    }).mockResolvedValueOnce({
      rows: [{ value: expectedconfigvalue }],
      rowCount: 1
    })
    mockedPool.query = mockQuery

    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype/anyconfigkey')
      .expect(200);

    expect(response.body).toEqual({ value: expectedconfigvalue })
  });

  test('config value undefined', async () => {

    const mockQuery = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1
      })
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })
    mockedPool.query = mockQuery

    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype/anyconfigkey')
      .expect(200);

    expect(response.body).toEqual({ value: null })
  });

  test('config table undefined', async () => {

    const mockQuery = vi.fn()
      .mockResolvedValueOnce({
        rows: [{ exists: false }],
        rowCount: 1
      })
    mockedPool.query = mockQuery

    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype/anyconfigkey')
      .expect(200);

    expect(response.body).toEqual({ value: null })
  });

  test('multiple config values from schema', async () => {

    const rowData = [
      {
        key: "config1",
        value: "value1"
      },
      {
        key: "config1",
        value: "value1"
      }
    ]

    const mockQuery = vi.fn().mockResolvedValueOnce({
      rows: [{ exists: true }],
      rowCount: 1
    }).mockResolvedValueOnce({
      rows: rowData,
      rowCount: 2
    })
    mockedPool.query = mockQuery

    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype')
      .expect(200);

    expect(response.body).toEqual(rowData)
  })


});

