import { mockFetch } from './mockResponse.js'
import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/vue'
import TrackMultiEditPage from '@/views/TrackMultiEditPage.vue'
import ResizeObserverMock from './__mocks__/ResizeObserver'
// import { ModalPlugin, BModal } from 'bootstrap-vue-next'
import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest'
import { store } from '../../src/store.js'
import { createStore } from 'vuex'

// skipped tests do not work because of https://github.com/testing-library/vue-testing-library/issues/298
describe('MultiEditPage', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
  })

  test('Simple', () => {
    const storeInstance = createStore(store)
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [storeInstance]
        }
      })
    rresult.getByText('Edit Tracks')
  })

  test.skip('Clean Button', async () => {
    const storeInstance = createStore(store)
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [storeInstance]
        }
      })
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
  test.skip('Clean Button 2', async () => {
    const storeInstance = createStore(store)
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [storeInstance]
        }
      })

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
