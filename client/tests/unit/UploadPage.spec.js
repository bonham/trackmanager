import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import UploadPage from '@/views/UploadPage.vue'
import { vi } from 'vitest'
import { Response } from 'cross-fetch'

describe('UploadPage', () => {
  test('UploadSuccess', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Response('{"message":"ok"}')))
    const user = userEvent.setup()
    const { getByLabelText } = render(UploadPage)
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
    const { getByLabelText, findByText } = render(UploadPage)
    const input = getByLabelText(/Drop files/i)
    const file = new File(['hello'], 'hello.gpx', { type: 'text/xml' })

    await user.upload(input, file)
    expect(await findByText('Failed')).toBeInTheDocument()
  })
})
