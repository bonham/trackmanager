import { describe, test, beforeEach, vi, expect } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/vue'
import SelectTracksPage from '@/views/SelectTracksPage.vue'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { store } from '../../src/store.js'
import { createStore } from 'vuex'
import { mockFetch } from './mockResponse.js'
import { Request, Response } from 'cross-fetch'

describe('SelectTracksPage - DOM testing', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('Request', Request) // eslint-disable-line no-undef
    vi.stubGlobal('Response', Response) // eslint-disable-line no-undef
  })

  // does not work because of https://github.com/testing-library/vue-testing-library/issues/298
  test('Load Tracks of 2021', async () => {
    const storeInstance = createStore(store)
    const rresult = render(SelectTracksPage, {
      props: { sid: 'abcd1234' },
      global: {
        plugins: [storeInstance]
      }
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    console.log('Our calls::::', mockFetch.calls)

    const button = await rresult.findByText('2021')
    await fireEvent.click(button)
    await rresult.findByText('Saupferchweg,')
  })
})
