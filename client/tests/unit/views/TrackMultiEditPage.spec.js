import { mockFetch } from '../mockResponse.js'
import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/vue'
import TrackMultiEditPage from '@/views/TrackMultiEditPage.vue'
import ResizeObserverMock from '../__mocks__/ResizeObserver'
import { Request, Response } from 'cross-fetch'
import { describe, beforeEach, test, expect, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

// skipped tests do not work because of https://github.com/testing-library/vue-testing-library/issues/298
describe('MultiEditPage', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    vi.stubGlobal('fetch', mockFetch)
    vi.stubGlobal('Request', Request)
    vi.stubGlobal('Response', Response)
    mockFetch.mockClear()


  })

  test('Simple', async () => {
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],


        }


      })
    expect(await rresult.findByText('Saupferchweg')).toBeInTheDocument()
    rresult.getByText('Edit Tracks')
    // rresult.debug()
  })

  test('Clean Button', async () => {
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],

        }

      })
    expect(await rresult.findByText('Saupferchweg')).toBeInTheDocument()

    const button1 = await rresult.findByRole('button', { name: 'updateName' })
    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual('/api/tracks/getall/sid/abcd1234')
    await fireEvent.click(button1)
    expect(await rresult.findByText('20210919_Muellerweg.gpx')).toBeInTheDocument()
    expect(mockFetch.mock.calls.length).toEqual(2)
    const secondCallRequest = mockFetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('PATCH')
  })
  test('Delete Button', async () => {
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],

        }

      })

    expect(await rresult.findByText('Saupferchweg')).toBeInTheDocument()
    const deleteButton = rresult.getByRole('button', { name: 'delete' })
    expect(mockFetch.mock.calls.length).toEqual(1)
    await fireEvent.click(deleteButton)
    await waitForElementToBeRemoved(
      () => rresult.queryByText('Saupferchweg'))
    expect(mockFetch.mock.calls.length).toEqual(2)
    const secondCallRequest = mockFetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('DELETE')
  })
})
