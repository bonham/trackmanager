import { describe, test, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import TrackMapPage from '@/views/TrackMapPage.vue'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { mockFetch } from './mockResponse.js'
import { Request, Response } from 'cross-fetch'
import { createTestingPinia } from '@pinia/testing'
import { useConfigStore } from '@/stores/configstore'


describe('TrackMapPage - DOM testing', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('Request', Request)
    vi.stubGlobal('Response', Response)

  })

  test('Load Tracks of 2021', async () => {

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const testPinia = createTestingPinia()
    const confstore = useConfigStore()
    vi.spyOn(confstore, 'loadConfig').mockImplementation(() => Promise.resolve())
    vi.spyOn(confstore, 'get').mockImplementation((a) => {
      console.log("Confstore argument:", a)
      if (a === "TRACKSTYLE") return "THREE_BROWN"
      else return "LATEST_YEAR"
    })

    const rresult = render(TrackMapPage, {
      props: { sid: 'abcd1234' },
      global: {
        plugins: [confstore],
      },
    })

    const button = await rresult.findByText('2021')
    await fireEvent.click(button)
    await rresult.findByText('2021')  // don't know how to test better
  })
})
