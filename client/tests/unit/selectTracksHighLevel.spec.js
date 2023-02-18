import { describe, test, beforeEach, vi, expect } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/vue'
import SelectTracksPage from '@/views/SelectTracksPage.vue'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { store } from '../../src/store.js'
import { createStore } from 'vuex'
import { mockFetch } from './mockResponse.js'

describe('SelectTracksPage - DOM testing', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('fetch', mockFetch)
  })

  test('Load Tracks of 2021', async () => {
    // fetch.mockResponse(responseMockFunction)

    const storeInstance = createStore(store)
    const rresult = render(SelectTracksPage, {
      props: { sid: 'abcd1234' },
      global: {
        plugins: [storeInstance]
      }
    })

    // note for next time: problem: component is not rendering buttons. Is it a rendering or ractivity problem, or is the data in the component not correct
    // look at console logs in SelectTracksPage - looks like mounted is coming before created ????? Need to do basic tests https://testing-library.com/docs/vue-testing-library/examples

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    console.log('Our calls::::', mockFetch.calls)

    const button = await rresult.findByText('2021')
    await fireEvent.click(button)
    await rresult.findByText('Saupferchweg,')
  })

  test.skip('Simple fetch', async () => {
    const r = await fetch('/')
    expect(r.status).toBe(200)
  })
})
