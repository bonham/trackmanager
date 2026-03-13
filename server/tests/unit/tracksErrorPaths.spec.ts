/**
 * Error-path and edge-case tests for server/src/routes/tracks.ts
 *
 * Covers:
 *  – catch-block / 500-error paths for every route (DB throws)
 *  – rowCount !== 1 branches in PUT and DELETE
 *  – GET /byid 404 (no rows returned)
 *  – GET /ids/byyear year='0' (null-date query)
 *  – PATCH /namefromsrc rowCount !== 1 (throws → 500)
 *  – POST /addtrack success / formidable-error / processUpload-error
 *  – Direct unit tests for exported getTracksByIdList helper
 */

import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

// ── mock pg BEFORE any imports ────────────────────────────────────────────────
vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

// ── mock formidable (used by POST /addtrack) ──────────────────────────────────
vi.mock('formidable', () => ({
  Formidable: vi.fn(),
}))

// ── mock node:fs/promises (mkdtemp used by POST /addtrack) ───────────────────
vi.mock('node:fs/promises', () => ({
  mkdtemp: vi.fn().mockResolvedValue('/tmp/trackmanager-upload-test123'),
}))

// ── mock processUpload ────────────────────────────────────────────────────────
vi.mock('../../src/lib/processUpload.js', () => ({
  processUpload: vi.fn(),
}))

// ── mock Track2DbWriter (used by PATCH /namefromsrc) ─────────────────────────
vi.mock('../../src/lib/Track2DbWriter.js', () => {
  const Track2DbWriter = vi.fn(class FakeWriter {
    init = vi.fn().mockResolvedValue(undefined)
    updateMetaData = vi.fn().mockResolvedValue(undefined)
    end = vi.fn()
  })
  return { Track2DbWriter }
})

import * as formidableModule from 'formidable'
import * as pg from 'pg'
import request from 'supertest'

import app from '../../src/app.js'
import getSchema from '../../src/lib/getSchema.js'
import { processUpload } from '../../src/lib/processUpload.js'
import { isAuthenticated } from '../../src/routes/auth/auth.js'
import { getTracksByIdList } from '../../src/routes/tracks.js'

vi.mock('../../src/lib/getSchema.js')
vi.mock('../../src/routes/auth/auth')
vi.mock('../../src/lib/canWriteToSchema.js', () => ({
  default: vi.fn(() => (_req: any, _res: any, next: any) => next()),
}))

const mockGetSchema = vi.mocked(getSchema)
const mockedIsAuthenticated = vi.mocked(isAuthenticated)
const MockedFormidable = vi.mocked(formidableModule.Formidable)
const mockedProcessUpload = vi.mocked(processUpload)

const mockQuery = vi.fn<() => Promise<any>>(() => Promise.resolve('initial'))
// Shared parse function reused across addtrack tests
const mockParseFn = vi.fn()

const VALID_SID = 'validsid'

const mockTrack1 = {
  id: 2,
  name: 'firsttrack',
  length: 34.5,
  length_calc: null,
  src: 'mysrc',
  time: new Date('2020-01-01T11:11:11.011Z'),
  timelength: null,
  timelength_calc: null,
  ascent: 3,
  ascent_calc: null,
}

beforeAll(() => {
  const MockedPool = vi.mocked(pg.Pool, { deep: true })
  MockedPool.mock.instances.forEach((poolInstance) => {
    vi.mocked(poolInstance.query).mockImplementation(() => mockQuery())
  })
})

beforeEach(() => {
  mockGetSchema.mockReset()
  mockQuery.mockReset()
  MockedFormidable.mockReset()
  mockParseFn.mockReset()
  mockedProcessUpload.mockReset()
  // Default: Formidable constructor injects the shared parse function into the instance
  MockedFormidable.mockImplementation(function (this: any) {
    this.parse = mockParseFn
  })
  mockedIsAuthenticated.mockImplementation((_req: any, _res: any, next: any) => next())
})

// ─── GET /getall – DB error ───────────────────────────────────────────────────

describe('GET /getall/sid/:sid – DB error', () => {
  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('connection lost'))
    await request(app).get(`/api/tracks/getall/sid/${VALID_SID}`).expect(500)
  })
})

// ─── GET /byid – 404 and DB error ────────────────────────────────────────────

describe('GET /byid/:trackId/sid/:sid – 404 and DB error', () => {
  test('no rows returned → 404', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [] })
    await request(app).get(`/api/tracks/byid/42/sid/${VALID_SID}`).expect(404)
  })

  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app).get(`/api/tracks/byid/42/sid/${VALID_SID}`).expect(500)
  })
})

// ─── POST /geojson – DB error ─────────────────────────────────────────────────

describe('POST /geojson/sid/:sid – DB error', () => {
  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app)
      .post(`/api/tracks/geojson/sid/${VALID_SID}`)
      .set('Content-Type', 'application/json')
      .send({ ids: [1, 2] })
      .expect(500)
  })
})

// ─── POST /bylist – DB error ──────────────────────────────────────────────────

describe('POST /bylist/sid/:sid – DB error', () => {
  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app)
      .post(`/api/tracks/bylist/sid/${VALID_SID}`)
      .set('Content-Type', 'application/json')
      .send([1, 2])
      .expect(500)
  })
})

// ─── GET /trackyears – DB error ───────────────────────────────────────────────

describe('GET /trackyears/sid/:sid – DB error', () => {
  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app).get(`/api/tracks/trackyears/sid/${VALID_SID}`).expect(500)
  })
})

// ─── GET /ids/byyear – year=0 and DB error ───────────────────────────────────

describe('GET /ids/byyear/:year/sid/:sid – edge cases', () => {
  test('year=0 queries null-date tracks and returns ids', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [{ id: 10 }, { id: 20 }] })
    const response = await request(app)
      .get(`/api/tracks/ids/byyear/0/sid/${VALID_SID}`)
      .expect(200)
    expect(response.body).toEqual([10, 20])
  })

  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app).get(`/api/tracks/ids/byyear/2021/sid/${VALID_SID}`).expect(500)
  })
})

// ─── POST /byextent – DB error ────────────────────────────────────────────────

describe('POST /byextent/sid/:sid – DB error', () => {
  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app)
      .post(`/api/tracks/byextent/sid/${VALID_SID}`)
      .set('Content-Type', 'application/json')
      .send([-10, -5, 10, 5])
      .expect(500)
  })
})

// ─── POST /idlist/byextentbytime – DB error ───────────────────────────────────

describe('POST /idlist/byextentbytime/sid/:sid – DB error', () => {
  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app)
      .post(`/api/tracks/idlist/byextentbytime/sid/${VALID_SID}`)
      .set('Content-Type', 'application/json')
      .send([-10, -5, 10, 5])
      .expect(500)
  })
})

// ─── PUT /byid – rowCount edge cases + DB error ───────────────────────────────

describe('PUT /byid/:trackId/sid/:sid – rowCount edge cases + DB error', () => {
  const body = { updateAttributes: ['name'], data: { name: 'newname' } }

  test('rowCount > 1 → 500 with message', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rowCount: 2 })
    const res = await request(app)
      .put(`/api/tracks/byid/88/sid/${VALID_SID}`)
      .send(body)
      .expect(500)
    expect(res.text).toContain('Row count was not 1')
  })

  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app)
      .put(`/api/tracks/byid/88/sid/${VALID_SID}`)
      .send(body)
      .expect(500)
  })
})

// ─── DELETE /byid – rowCount edge cases + DB error ────────────────────────────

describe('DELETE /byid/:trackId/sid/:sid – rowCount edge cases + DB error', () => {
  test('rowCount > 1 on main delete → 500 with message', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    // All three queries return rowCount=2; only the third matters for the check
    mockQuery.mockResolvedValue({ rowCount: 2 })
    const res = await request(app)
      .delete(`/api/tracks/byid/88/sid/${VALID_SID}`)
      .expect(500)
    expect(res.text).toContain('Row count was not 1')
  })

  test('pool.query throws → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockRejectedValue(new Error('DB error'))
    await request(app).delete(`/api/tracks/byid/88/sid/${VALID_SID}`).expect(500)
  })
})

// ─── PATCH /namefromsrc – rowCount !== 1 ──────────────────────────────────────

describe('PATCH /namefromsrc/:trackId/sid/:sid – rowCount error', () => {
  test('rowCount !== 1 throws and returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rowCount: 0, rows: [] })
    await request(app)
      .patch(`/api/tracks/namefromsrc/42/sid/${VALID_SID}`)
      .expect(500)
  })
})

// ── POST /addtrack ────────────────────────────────────────────────────────────

describe('POST /addtrack/sid/:sid', () => {
  test('successful upload returns { message: "ok" }', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockedProcessUpload.mockResolvedValue(undefined)
    mockParseFn.mockImplementation((_req: any, cb: any) =>
      cb(null, {}, { newtrack: [{ filepath: '/tmp/trackmanager-upload-test/track.gpx' }] }),
    )

    const response = await request(app)
      .post(`/api/tracks/addtrack/sid/${VALID_SID}`)
      .attach('newtrack', Buffer.from('fake gpx content'), 'track.gpx')
      .expect(200)

    expect(response.body.message).toBe('ok')
  })

  test('formidable parse error → 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockParseFn.mockImplementation((_req: any, cb: any) =>
      cb(new Error('upload parse failed'), {}, {}),
    )

    await request(app)
      .post(`/api/tracks/addtrack/sid/${VALID_SID}`)
      .attach('newtrack', Buffer.from('fake gpx content'), 'track.gpx')
      .expect(500)
  })

  test('processUpload error → 500 with fileName in body', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockedProcessUpload.mockRejectedValue(new Error('conversion failed'))
    mockParseFn.mockImplementation((_req: any, cb: any) =>
      cb(null, {}, { newtrack: [{ filepath: '/tmp/trackmanager-upload-test/track.gpx' }] }),
    )

    const response = await request(app)
      .post(`/api/tracks/addtrack/sid/${VALID_SID}`)
      .attach('newtrack', Buffer.from('fake gpx content'), 'track.gpx')
      .expect(500)

    expect(response.body.message).toBe('error')
    expect(response.body.fileName).toBe('track.gpx')
  })
})

// ─── getTracksByIdList – direct unit tests ────────────────────────────────────

describe('getTracksByIdList – direct', () => {
  test('empty idList returns [] without querying DB', async () => {
    const result = await getTracksByIdList('myschema', [])
    expect(result).toEqual([])
    expect(mockQuery).not.toHaveBeenCalled()
  })

  test('non-empty idList queries DB and returns parsed rows', async () => {
    mockQuery.mockResolvedValue({ rows: [mockTrack1] })
    const result = await getTracksByIdList('myschema', [2])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
    expect(result[0].name).toBe('firsttrack')
  })
})
