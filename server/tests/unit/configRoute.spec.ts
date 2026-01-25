import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

import pg from 'pg';
import request from 'supertest';

import app from '../../src/app.js';
import getSchema from '../../src/lib/getSchema.js';



vi.mock('../../src/routes/auth/auth');
vi.mock('../../src/lib/getSchema.js')

const mockGetSchema = vi.mocked(getSchema)

describe('get config', () => {

  const expectedconfigvalue = "MYCONFIGVALUE"
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
  });

  test('config exists', async () => {

    mockQuery
      .mockImplementationOnce(() => Promise.resolve({
        rows: [{ exists: true }],
        rowCount: 1
      }))
      .mockImplementationOnce(() => Promise.resolve({
        rows: [{ value: expectedconfigvalue }],
        rowCount: 1
      }))

    mockGetSchema.mockResolvedValue('myschema');

    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype/anyconfigkey')
      .expect(200);

    expect(response.body).toEqual({ value: expectedconfigvalue })
  });

  test('config value undefined', async () => {

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1
      })
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0
      })

    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype/anyconfigkey')
      .expect(200);

    expect(response.body).toEqual({ value: null })
  });

  test('config table undefined', async () => {

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ exists: false }],
        rowCount: 1
      })

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

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1
      })
      .mockResolvedValueOnce({
        rows: rowData,
        rowCount: 2
      })

    mockGetSchema.mockResolvedValue('myschema');
    const response = await request(app)
      .get('/api/config/get/sid/anysid/schematype')
      .expect(200);

    expect(response.body).toEqual(rowData)
  })


});

