import { describe, test, beforeEach, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import TrackMapPage from '@/views/TrackMapPage.vue'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { mockFetch } from './mockResponse.js'
import { Request, Response } from 'cross-fetch'
import { createTestingPinia } from '@pinia/testing'

let CustomStub


describe('TrackMapPage - DOM testing', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('Request', Request) // eslint-disable-line no-undef
    vi.stubGlobal('Response', Response) // eslint-disable-line no-undef
    CustomStub = {
      template: '<p>Nothing</p>',
    }
  })

  test('Load Tracks of 2021', async () => {
    const rresult = render(TrackMapPage, {
      props: { sid: 'abcd1234' },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          RouterLink: CustomStub
        }
      },
    })

    const button = await rresult.findByText('2021')
    await fireEvent.click(button)
    await rresult.findByText('2021')  // don't know how to test better
  })
})
