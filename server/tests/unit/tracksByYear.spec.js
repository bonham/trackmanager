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

describe('tracks - byYear', () => {
  beforeEach(
    mockGetSchema.mockReset()
  )
  test('happy path', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    const response = await request(app)
      .get('/api/tracks/byyear/2021/sid/correct')
      .expect(200)

    expect(response.body).toEqual([mockTrack1])
    expect(mockGetSchema).toHaveBeenCalled()
  })
  test('invalid sid', async () => {
    mockGetSchema.mockResolvedValue(null)
    await request(app)
      .get('/api/tracks/byyear/2021/sid/2-3')
      .expect(401)
    expect(mockGetSchema).toHaveBeenCalled()
  })

  test('wrong year format', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .get('/api/tracks/byyear/A2021/sid/correct')
      .expect(400)
  })
})
