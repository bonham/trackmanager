import fetchMock from 'jest-fetch-mock'
import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/vue'
import TrackMultiEditPage from '@/views/TrackMultiEditPage.vue'
import ResizeObserver from './__mocks__/ResizeObserver'
import { responseMockFunction } from './mockResponse'
import { ModalPlugin, BModal } from 'bootstrap-vue'

fetchMock.enableMocks()

describe.skip('MultiEditPage', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
    global.ResizeObserver = ResizeObserver
  })
  afterEach(() => {
  })
  test('Clean Button', async () => {
    fetch.mockResponse(responseMockFunction)

    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        components: {
          BModal
        }
      },
      vue => vue.use(ModalPlugin)
    )
    await rresult.findByText('Saupferchweg')
    const button1 = await rresult.findByText('Clean all')
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual('/api/tracks/getall/sid/abcd1234')
    await fireEvent.click(button1)
    const button2 = await rresult.findByText('Proceed')
    await fireEvent.click(button2)
    await rresult.findByText('Muellerweg')
    expect(fetch.mock.calls.length).toEqual(2)
    const secondCallRequest = fetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('PUT')
    secondCallRequest.json().then(body => {
      expect(body).toHaveProperty('data.name', 'Muellerweg')
      expect(body).toHaveProperty('updateAttributes.0', 'name')
    })
  })
  test('Clean Button', async () => {
    fetch.mockResponse(responseMockFunction)

    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        components: {
          BModal
        }
      },
      vue => vue.use(ModalPlugin)
    )
    await rresult.findByText('Saupferchweg')
    const deleteButton = await rresult.findByLabelText('trash')
    expect(fetch.mock.calls.length).toEqual(1)
    await fireEvent.click(deleteButton)
    await waitForElementToBeRemoved(
      () => rresult.queryByText('Saupferchweg'))
    expect(fetch.mock.calls.length).toEqual(2)
    const secondCallRequest = fetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('DELETE')
  })
})
