const request = require('supertest')
const app = require('../../app')
const { Pool } = require('pg')
jest.mock('pg')
jest.mock('../../lib/getSchema', () => jest.fn())
const getSchema = require('../../lib/getSchema')

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

describe('tracks - getall', () => {
  test('correctsid', async () => {
    getSchema.mockResolvedValue('myschema')
    const response = await request(app)
      .get('/api/tracks/getall/sid/correct')
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body).toEqual(expect.arrayContaining([mockTrack1]))
    expect(getSchema).toHaveBeenCalled()
  })
  test('wrongsid', async () => {
    getSchema.mockResolvedValue(null)
    await request(app)
      .get('/api/tracks/getall/sid/wrong')
      .expect(401)
    expect(getSchema).toHaveBeenCalled()
  })
  test('getall nosid', async () => {
    await request(app)
      .get('/api/tracks/getall')
      .expect(404)
  })
  test('getall nosid 2', async () => {
    await request(app)
      .get('/api/tracks/getall/sid/')
      .expect(404)
  })
  test('getall sid nonalpha', async () => {
    await request(app)
      .get('/api/tracks/getall/sid/a-0')
      .expect(401)
  })
})
