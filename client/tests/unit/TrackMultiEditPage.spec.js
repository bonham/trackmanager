import fetchMock from 'jest-fetch-mock'
import { render, fireEvent } from '@testing-library/vue'
import TrackMultiEditPage from '@/views/TrackMultiEditPage.vue'
import ResizeObserver from './__mocks__/ResizeObserver'
import { responseMockFunction } from './mockResponse'

fetchMock.enableMocks()

describe('MultiEditPage', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    global.ResizeObserver = ResizeObserver
  })
  afterEach(() => {
  })
  test('Simple', async () => {
    fetch.mockResponse(responseMockFunction)

    const rresult = render(
      TrackMultiEditPage, {
        props: { sid: 'abcd1234' }
      })
    await rresult.findByText('Saupferchweg')
    const button = await rresult.findByText('Clean all')
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual('/api/tracks/getall/sid/abcd1234')
    await fireEvent.click(button)
    await rresult.findByText('Muellerweg')
    expect(fetch.mock.calls.length).toEqual(2)
    const secondCallRequest = fetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('PUT')
    secondCallRequest.json().then(body => {
      expect(body).toHaveProperty('data.name', 'Muellerweg')
      expect(body).toHaveProperty('updateAttributes.0', 'name')
    })
  })
})
