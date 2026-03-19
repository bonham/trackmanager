import { render, fireEvent, waitFor } from '@testing-library/vue'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import RegistrationModal from '@/components/auth/RegistrationModal.vue'

vi.mock('@/lib/auth/registration')

vi.mock('bootstrap-vue-next', () => ({
  BModal: {
    name: 'BModal',
    props: {
      modelValue: { type: Boolean, default: false },
      title: { type: String, default: '' },
    },
    emits: ['update:modelValue', 'ok'],
    template: `
      <div v-if="modelValue" :data-modal-title="title">
        <slot />
        <slot name="footer" />
        <button @click="$emit('ok', $event)">__ok__</button>
      </div>
    `,
  },
}))

import { registerPasskey } from '@/lib/auth/registration'

const mockRegisterPasskey = vi.mocked(registerPasskey)

const mockFetch = vi.fn<typeof fetch>()

function makeFetchResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function renderRegistrationModal(visible = true) {
  const pinia = createTestingPinia({ stubActions: false })
  const result = render(RegistrationModal, {
    props: { visible },
    global: { plugins: [pinia] },
  })
  return result
}

describe('RegistrationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(makeFetchResponse({ userid: '' }))
    vi.stubGlobal('fetch', mockFetch)
  })

  test('shows registration key input when visible', () => {
    const { getByLabelText } = renderRegistrationModal()
    expect(getByLabelText(/Registration Key/)).toBeInTheDocument()
  })

  test('does not render when not visible', () => {
    const { queryByLabelText } = renderRegistrationModal(false)
    expect(queryByLabelText(/Registration Key/)).not.toBeInTheDocument()
  })

  test('empty key marks input as invalid', async () => {
    const { getByRole } = renderRegistrationModal()

    const okButton = getByRole('button', { name: '__ok__' })
    await fireEvent.click(okButton)

    await waitFor(() => {
      const input = document.getElementById('registration-key')
      expect(input).toHaveClass('is-invalid')
    })
  })

  test('valid key calls registerPasskey with the key value', async () => {
    mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
    const { getByLabelText, getByRole } = renderRegistrationModal()

    const input = getByLabelText(/Registration Key/)
    await fireEvent.update(input, 'abc-123')

    const okButton = getByRole('button', { name: '__ok__' })
    await fireEvent.click(okButton)

    await waitFor(() => {
      expect(mockRegisterPasskey).toHaveBeenCalledWith('abc-123')
    })
  })

  test('successful registration emits update:visible false to close modal', async () => {
    mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
    const { getByLabelText, getByRole, emitted } = renderRegistrationModal()

    const input = getByLabelText(/Registration Key/)
    await fireEvent.update(input, 'valid-key')

    const okButton = getByRole('button', { name: '__ok__' })
    await fireEvent.click(okButton)

    await waitFor(() => {
      expect(emitted()['update:visible']).toBeTruthy()
      const emissions = emitted()['update:visible']
      expect(emissions![emissions!.length - 1]).toEqual([false])
    })
  })

  test('successful registration emits registered event', async () => {
    mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
    const { getByLabelText, getByRole, emitted } = renderRegistrationModal()

    const input = getByLabelText(/Registration Key/)
    await fireEvent.update(input, 'valid-key')

    const okButton = getByRole('button', { name: '__ok__' })
    await fireEvent.click(okButton)

    await waitFor(() => {
      expect(emitted()).toHaveProperty('registered')
    })
  })

  test('failed registration shows failure message', async () => {
    mockRegisterPasskey.mockResolvedValue({ success: false, message: 'Key is wrong' })
    const { getByLabelText, getByRole, findByText } = renderRegistrationModal()

    const input = getByLabelText(/Registration Key/)
    await fireEvent.update(input, 'bad-key')

    const okButton = getByRole('button', { name: '__ok__' })
    await fireEvent.click(okButton)

    expect(await findByText('Key is wrong')).toBeInTheDocument()
  })

  test('failed registration shows "Registration failed" label', async () => {
    mockRegisterPasskey.mockResolvedValue({ success: false, message: 'Some error' })
    const { getByLabelText, getByRole, findByText } = renderRegistrationModal()

    await fireEvent.update(getByLabelText(/Registration Key/), 'bad-key')
    await fireEvent.click(getByRole('button', { name: '__ok__' }))

    expect(await findByText('Registration failed')).toBeInTheDocument()
  })
})
