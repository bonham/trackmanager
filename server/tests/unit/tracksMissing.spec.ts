/**
 * Tests for routes in tracks.ts that are not covered by tracks.spec.ts,
 * tracks-getall.spec.ts or tracksIdsByYear.spec.ts.
 *
 * Covered here:
 *  GET  /trackyears/sid/:sid
 *  POST /byextent/sid/:sid
 *  POST /geojson/sid/:sid
 *  POST /bylist/sid/:sid         – edge cases (empty list, string ids)
 *  POST /idlist/byextentbytime/sid/:sid – edge cases (bad bbox)
 *  PATCH /namefromsrc/:trackId/sid/:sid
 */

import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

// ---- mock pg BEFORE importing the app ----
vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

// mock Track2DbWriter so PATCH /namefromsrc doesn't open a real DB connection
vi.mock('../../src/lib/Track2DbWriter.js', () => {
  const Track2DbWriter = vi.fn(class FakeWriter {
    init = vi.fn().mockResolvedValue(undefined)
    updateMetaData = vi.fn().mockResolvedValue(undefined)
    end = vi.fn()
  })
  return { Track2DbWriter }
})

import * as pg from 'pg'
import request from 'supertest'

import app from '../../src/app.js'
import getSchema from '../../src/lib/getSchema.js'
import { isAuthenticated } from '../../src/routes/auth/auth.js'

vi.mock('../../src/lib/getSchema.js')
vi.mock('../../src/routes/auth/auth')

const mockGetSchema = vi.mocked(getSchema)
const mockedIsAuthenticated = vi.mocked(isAuthenticated)

// ---- shared pool-query mock ----
const mockQuery = vi.fn<() => Promise<any>>(() => Promise.resolve('initial'))

beforeAll(() => {
  const MockedPool = vi.mocked(pg.Pool, { deep: true })
  MockedPool.mock.instances.forEach((poolInstance) => {
    vi.mocked(poolInstance.query).mockImplementation(() => mockQuery())
  })
})

beforeEach(() => {
  mockGetSchema.mockReset()
  mockQuery.mockReset()

  // let authenticated routes through by default
  mockedIsAuthenticated.mockImplementation((_req: any, _res: any, next: any) => next())
})

// ─── GET /trackyears/sid/:sid ───────────────────────────────────────────────

describe('GET /trackyears/sid/:sid', () => {
  test('happy path returns array of year strings', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [{ year: '2019' }, { year: '2021' }, { year: '2023' }] })

    const response = await request(app)
      .get('/api/tracks/trackyears/sid/validsid')
      .expect(200)

    expect(response.body).toEqual(['2019', '2021', '2023'])
  })

  test('invalid sid returns 401', async () => {
    mockGetSchema.mockResolvedValue(null)
    await request(app)
      .get('/api/tracks/trackyears/sid/bad-sid')
      .expect(401)
  })

  test('empty result returns empty array', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [] })

    const response = await request(app)
      .get('/api/tracks/trackyears/sid/validsid')
      .expect(200)

    expect(response.body).toEqual([])
  })
})

// ─── POST /byextent/sid/:sid ────────────────────────────────────────────────

const mockTrack1 = {
  id: 2,
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: new Date('2020-01-01T11:11:11.011Z'),
  ascent: 3,
}

describe('POST /byextent/sid/:sid', () => {
  test('happy path returns tracks', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [mockTrack1] })

    const response = await request(app)
      .post('/api/tracks/byextent/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([-10, -5, 10, 5])
      .expect(200)

    expect(response.body).toHaveLength(1)
  })

  test('invalid sid returns 401', async () => {
    mockGetSchema.mockResolvedValue(null)
    await request(app)
      .post('/api/tracks/byextent/sid/bad-sid')
      .set('Content-Type', 'application/json')
      .send([-10, -5, 10, 5])
      .expect(401)
  })

  test('body is not array returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .post('/api/tracks/byextent/sid/validsid')
      .set('Content-Type', 'application/json')
      .send({ wrong: 'payload' })
      .expect(500)
  })

  test('bbox with wrong length returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .post('/api/tracks/byextent/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([-10, -5, 10])    // only 3 elements
      .expect(500)
  })

  test('bbox with non-numbers returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .post('/api/tracks/byextent/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([-10, '-5', 10, 5])   // string in array
      .expect(500)
  })
})

// ─── POST /geojson/sid/:sid ─────────────────────────────────────────────────

const mockGeoJsonString = JSON.stringify({
  type: 'MultiLineString',
  coordinates: [[[8.1, 47.1], [8.2, 47.2]]]
})

describe('POST /geojson/sid/:sid', () => {
  test('happy path returns geojson array', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [{ id: 3, geojson: mockGeoJsonString }] })

    const response = await request(app)
      .post('/api/tracks/geojson/sid/validsid')
      .set('Content-Type', 'application/json')
      .send({ ids: [3] })
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body[0]).toHaveProperty('id', 3)
    expect(response.body[0].geojson.type).toBe('MultiLineString')
  })

  test('empty ids returns 200 with empty array', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    const response = await request(app)
      .post('/api/tracks/geojson/sid/validsid')
      .set('Content-Type', 'application/json')
      .send({ ids: [] })
      .expect(200)

    expect(response.body).toEqual([])
  })

  test('body without ids property returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    await request(app)
      .post('/api/tracks/geojson/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([1, 2])       // array instead of { ids: [...] }
      .expect(500)
  })

  test('invalid sid returns 401', async () => {
    mockGetSchema.mockResolvedValue(null)

    await request(app)
      .post('/api/tracks/geojson/sid/bad-sid')
      .set('Content-Type', 'application/json')
      .send({ ids: [1] })
      .expect(401)
  })
})

// ─── POST /bylist/sid/:sid – edge cases ─────────────────────────────────────

describe('POST /bylist/sid/:sid – edge cases', () => {
  test('empty list returns 200 with empty array', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    const response = await request(app)
      .post('/api/tracks/bylist/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([])
      .expect(200)

    expect(response.body).toEqual([])
  })

  test('body with strings instead of numbers returns 400', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    await request(app)
      .post('/api/tracks/bylist/sid/validsid')
      .set('Content-Type', 'application/json')
      .send(['618'])      // string ids ← the original bug
      .expect(400)
  })

  test('ids not found in DB returns empty array', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rows: [] })

    const response = await request(app)
      .post('/api/tracks/bylist/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([999])
      .expect(200)

    expect(response.body).toEqual([])
  })

  test('invalid sid returns 401', async () => {
    mockGetSchema.mockResolvedValue(null)

    await request(app)
      .post('/api/tracks/bylist/sid/bad-sid')
      .set('Content-Type', 'application/json')
      .send([1, 2])
      .expect(401)
  })
})

// ─── POST /idlist/byextentbytime/sid/:sid – edge cases ──────────────────────

describe('POST /idlist/byextentbytime/sid/:sid – edge cases', () => {
  test('non-array body returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    await request(app)
      .post('/api/tracks/idlist/byextentbytime/sid/validsid')
      .set('Content-Type', 'application/json')
      .send({ wrong: 'payload' })
      .expect(500)
  })

  test('bbox with wrong length returns 500', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    await request(app)
      .post('/api/tracks/idlist/byextentbytime/sid/validsid')
      .set('Content-Type', 'application/json')
      .send([1, 2, 3])   // need exactly 4 numbers
      .expect(500)
  })

  test('invalid sid returns 401', async () => {
    mockGetSchema.mockResolvedValue(null)

    await request(app)
      .post('/api/tracks/idlist/byextentbytime/sid/bad-sid')
      .set('Content-Type', 'application/json')
      .send([-10, -5, 10, 5])
      .expect(401)
  })
})

// ─── PATCH /namefromsrc/:trackId/sid/:sid ───────────────────────────────────

describe('PATCH /namefromsrc/:trackId/sid/:sid', () => {
  test('happy path returns 204', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    mockQuery.mockResolvedValue({ rowCount: 1, rows: [{ src: 'activity_2021-03-14_run.gpx' }] })

    await request(app)
      .patch('/api/tracks/namefromsrc/42/sid/validsid')
      .expect(204)
  })

  test('invalid sid returns 401', async () => {
    mockGetSchema.mockResolvedValue(null)

    await request(app)
      .patch('/api/tracks/namefromsrc/42/sid/bad-sid')
      .expect(401)
  })

  test('non-numeric trackId returns 400', async () => {
    mockGetSchema.mockResolvedValue('myschema')

    await request(app)
      .patch('/api/tracks/namefromsrc/abc/sid/validsid')
      .expect(400)
  })
})
