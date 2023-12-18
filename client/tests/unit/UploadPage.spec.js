/* eslint-disable @typescript-eslint/unbound-method */
import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import UploadPage from '@/views/UploadPage.vue'
import { vi, expect, test, beforeEach } from 'vitest'
import { Response } from 'cross-fetch'
import { createTestingPinia } from '@pinia/testing'

let CustomStub

describe('UploadPage', () => {
  beforeEach(() => {
    CustomStub = {
      template: '<p>Nothing</p>',
    }
  })
  test('UploadSuccess', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('{"message":"ok"}')))
    const user = userEvent.setup()
    const { getByLabelText } = render(UploadPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            RouterLink: CustomStub
          }
        },

      })
    const input = getByLabelText(/Drop files/i)
    const file = new File(['hello'], 'hello.gpx', { type: 'text/xml' })

    await user.upload(input, file)
    expect(input.files[0]).toBe(file)
  })

  test('UploadFailure', async () => {
    // upload fails
    const response = new Response('{"message":"myerror"}', { status: 422 })
    vi.stubGlobal('fetch', vi.fn(() => response))

    const user = userEvent.setup()
    const { getByLabelText, findByText } = render(UploadPage,
      {
        props: { sid: 'abcd1234' },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            RouterLink: CustomStub
          }
        },
      })
    const input = getByLabelText(/Drop files/i)
    const file = new File(['hello'], 'hello.gpx', { type: 'text/xml' })

    await user.upload(input, file)
    expect(await findByText('Failed')).toBeInTheDocument()
  })
})
