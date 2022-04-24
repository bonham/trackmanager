const request = require('supertest')
const app = require('../../app')
jest.mock('pg')
const { Pool } = require('pg')
jest.mock('../../lib/getSchema')
const mockGetSchema = require('../../lib/getSchema')

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3
}

// eslint-disable-next-line no-unused-vars
const queryMock = jest
  .spyOn(Pool.prototype, 'query')
  .mockResolvedValue({
    rows: [mockTrack1]
  })

describe('tracks - byid', () => {
  beforeEach(
    mockGetSchema.mockReset()
  )
  test('happy path', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    const response = await request(app)
      .get('/api/tracks/byid/123/sid/correct')
      .expect(200)

    expect(response.body).toEqual(mockTrack1)
    expect(mockGetSchema).toHaveBeenCalled()
  })
  test('is sid validation active', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .get('/api/tracks/byid/123/sid/1-2')
      .expect(401)
    expect(mockGetSchema).toHaveBeenCalled()
  })

  test('missing track id', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .get('/api/tracks/byid//sid/correct')
      .expect(404)
  })
  test('missing track id 2', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .get('/api/tracks/byid/sid/correct')
      .expect(404)
  })
  test('wrong track id format', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .get('/api/tracks/byid/abc/sid/correct')
      .expect(400)
  })
})
