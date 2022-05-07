const request = require('supertest')
const app = require('../../app')
jest.mock('../../lib/getSchema')
const mockGetSchema = require('../../lib/getSchema')
const { Pool } = require('pg')
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }
  return { Pool: jest.fn(() => mClient) }
})

const mockTrack1 = {
  id: '2',
  name: 'firsttrack',
  length: 34.5,
  src: 'mysrc',
  time: '2020-01-01T11:11:11.011Z',
  ascent: 3
}

describe('tracks - byYear', () => {
  let mockPool
  beforeEach(() => {
    mockGetSchema.mockReset()
    mockPool = new Pool()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('happy path', async () => {
    mockPool.query.mockResolvedValue({ rows: [mockTrack1] })
    mockGetSchema.mockResolvedValue('myschema')
    const response = await request(app)
      .get('/api/tracks/byyear/2021/sid/correct')
      .expect(200)

    expect(response.body).toEqual([mockTrack1])
    expect(mockGetSchema).toHaveBeenCalled()
  })
  test('sid not alphanum', async () => {
    mockGetSchema.mockResolvedValue(null)
    await request(app)
      .get('/api/tracks/byyear/2021/sid/2-3')
      .expect(401)
  })

  test('wrong year format', async () => {
    mockGetSchema.mockResolvedValue('myschema')
    await request(app)
      .get('/api/tracks/byyear/A2021/sid/correct')
      .expect(400)
  })
})

describe('Update track byid', () => {
  let mockPool
  beforeEach(() => {
    mockPool = new Pool()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  test('simple', async () => {
    mockPool.query.mockResolvedValue({ rowCount: 1 })
    mockGetSchema.mockResolvedValue('myschema')

    await request(app)
      .put('/api/tracks/byid/88/sid/abcsid')
      .send(
        {
          data: { name: 'newname' },
          updateAttributes: ['name']
        })
      .expect(200)
  })
})

// describe('Delete track byid', () => {
//   test('simple', async () => {
//     await request(app)
//       .delete('/api/tracks/byid/88/sid/abcsid')
//       .expect(200)
//   })
// })
