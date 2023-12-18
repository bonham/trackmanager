import { mockFetch } from './mockResponse.js'
import { render, fireEvent, waitForElementToBeRemoved } from '@testing-library/vue'
import TrackMultiEditPage from '@/views/TrackMultiEditPage.vue'
import ResizeObserverMock from './__mocks__/ResizeObserver'
import { Request, Response } from 'cross-fetch'
import { describe, beforeEach, test, expect } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
let CustomStub

// skipped tests do not work because of https://github.com/testing-library/vue-testing-library/issues/298
describe('MultiEditPage', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock) // eslint-disable-line no-undef
    vi.stubGlobal('fetch', mockFetch) // eslint-disable-line no-undef
    vi.stubGlobal('Request', Request) // eslint-disable-line no-undef
    vi.stubGlobal('Response', Response) // eslint-disable-line no-undef

    fetch.mockClear()

    CustomStub = {
      template: '<p>Nothing</p>',
    }
  })

  test('Simple', async () => {
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            RouterLink: CustomStub
          }

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
          stubs: {
            RouterLink: CustomStub
          }
        }

      })
    expect(await rresult.findByText('Saupferchweg')).toBeInTheDocument()

    const button1 = await rresult.findByText('Clean all')
    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual('/api/tracks/getall/sid/abcd1234')
    await fireEvent.click(button1)
    expect(await rresult.findByText('Muellerweg')).toBeInTheDocument()
    expect(fetch.mock.calls.length).toEqual(2)
    const secondCallRequest = fetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('PUT')
    secondCallRequest.json().then(body => {
      expect(body).toHaveProperty('data.name', 'Muellerweg')
      expect(body).toHaveProperty('updateAttributes.0', 'name')
    })
  })
  test('Clean Button 2', async () => {
    const rresult = render(
      TrackMultiEditPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            RouterLink: CustomStub
          }
        }

      })

    expect(await rresult.findByText('Saupferchweg')).toBeInTheDocument()
    const deleteButton = rresult.getByRole('button', { name: 'delete' })
    expect(fetch.mock.calls.length).toEqual(1)
    await fireEvent.click(deleteButton)
    await waitForElementToBeRemoved(
      () => rresult.queryByText('Saupferchweg'))
    expect(fetch.mock.calls.length).toEqual(2)
    const secondCallRequest = fetch.mock.calls[1][0]
    expect(secondCallRequest.method).toEqual('DELETE')
  })
})
