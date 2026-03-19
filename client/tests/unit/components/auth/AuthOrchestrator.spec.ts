import { render, fireEvent, waitFor } from '@testing-library/vue'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import AuthOrchestrator from '@/components/auth/AuthOrchestrator.vue'
import { useUserLoginStore } from '@/stores/userlogin'

// ---------------------------------------------------------------------------
// Module mocks (hoisted before imports)
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth/login')
vi.mock('@/lib/auth/registration')

/**
 * Stub BModal so it renders its slots conditionally on modelValue and exposes
 * an "__ok__" button that emits the 'ok' event (mirrors the built-in footer).
 * BButton is rendered as a real <button> so @click works normally.
 */
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
  BButton: {
    name: 'BButton',
    emits: ['click'],
    template: `<button @click="$emit('click')"><slot /></button>`,
  },
}))

// ---------------------------------------------------------------------------
// Import mocked helpers AFTER vi.mock declarations
// ---------------------------------------------------------------------------

import { performWebauthnLogin } from '@/lib/auth/login'
import { registerPasskey } from '@/lib/auth/registration'

const mockPerformWebauthnLogin = vi.mocked(performWebauthnLogin)
const mockRegisterPasskey = vi.mocked(registerPasskey)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFetch = vi.fn<typeof fetch>()

function makeFetchResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function renderAuthOrchestrator() {
  const pinia = createTestingPinia({ stubActions: false })
  const result = render(AuthOrchestrator, { global: { plugins: [pinia] } })
  const store = useUserLoginStore(pinia)
  return { ...result, store }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockImplementation(() => Promise.resolve(makeFetchResponse({ userid: '' })))
    vi.stubGlobal('fetch', mockFetch)
  })

  // -------------------------------------------------------------------------
  // Smoke
  // -------------------------------------------------------------------------
  test('mounts without errors', () => {
    const { container } = renderAuthOrchestrator()
    expect(container).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Login request via loginRequestCount
  // -------------------------------------------------------------------------
  describe('login request (loginRequestCount)', () => {
    test('incrementing loginRequestCount triggers performWebauthnLogin', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { store } = renderAuthOrchestrator()

      store.loginRequestCount++
      await nextTick()

      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalledOnce()
      })
    })

    test('successful login does not show login failure modal', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { store, queryByRole } = renderAuthOrchestrator()

      store.loginRequestCount++
      await nextTick()

      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalled()
      })
      expect(queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    })

    test('failed login shows login failure modal with error message', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: false, message: 'Auth error' })
      const { store, findByText, findByRole } = renderAuthOrchestrator()

      store.loginRequestCount++
      await nextTick()

      expect(await findByText('Auth error')).toBeInTheDocument()
      expect(await findByRole('button', { name: 'Retry' })).toBeInTheDocument()
    })

    test('failed login with NotAllowedError shows abort message', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({
        success: false,
        message: 'technical detail',
        errorId: 'NotAllowedError',
      })
      const { store, findByText } = renderAuthOrchestrator()

      store.loginRequestCount++
      await nextTick()

      expect(await findByText('Login was aborted or is not allowed.')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Login failure modal interactions
  // -------------------------------------------------------------------------
  describe('login failure modal', () => {
    async function showLoginFailureModal() {
      mockPerformWebauthnLogin.mockResolvedValue({ success: false, message: 'Nope' })
      const ctx = renderAuthOrchestrator()
      ctx.store.loginRequestCount++
      await nextTick()
      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalled()
      })
      return ctx
    }

    test('Retry button calls performWebauthnLogin again', async () => {
      const { findByRole } = await showLoginFailureModal()
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })

      await fireEvent.click(await findByRole('button', { name: 'Retry' }))

      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalledTimes(2)
      })
    })

    test('successful retry hides the modal', async () => {
      const { findByRole, queryByRole } = await showLoginFailureModal()
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })

      await fireEvent.click(await findByRole('button', { name: 'Retry' }))

      await waitFor(() => {
        expect(queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      })
    })

    test('Cancel button hides the modal', async () => {
      const { findByRole, queryByRole } = await showLoginFailureModal()

      await fireEvent.click(await findByRole('button', { name: 'Cancel' }))

      await nextTick()
      expect(queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })

    test('Register button hides login modal and shows registration modal', async () => {
      const { findByRole, queryByRole, findByLabelText } = await showLoginFailureModal()

      await fireEvent.click(await findByRole('button', { name: 'Register' }))
      await nextTick()

      // Login modal should be gone
      expect(queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      // Registration input should appear
      expect(await findByLabelText(/Registration Key/)).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Registration modal (via login failure → Register)
  // -------------------------------------------------------------------------
  describe('registration modal', () => {
    async function openRegistrationModal() {
      mockPerformWebauthnLogin.mockResolvedValue({ success: false, message: 'Nope' })
      const ctx = renderAuthOrchestrator()
      ctx.store.loginRequestCount++
      await nextTick()
      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalled()
      })

      await fireEvent.click(await ctx.findByRole('button', { name: 'Register' }))
      await nextTick()
      return ctx
    }

    test('shows registration key input', async () => {
      const { findByLabelText } = await openRegistrationModal()
      expect(await findByLabelText(/Registration Key/)).toBeInTheDocument()
    })

    test('valid key calls registerPasskey', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
      const { findByLabelText, findByRole } = await openRegistrationModal()

      await fireEvent.update(await findByLabelText(/Registration Key/), 'abc-123')
      await fireEvent.click(await findByRole('button', { name: '__ok__' }))

      await waitFor(() => {
        expect(mockRegisterPasskey).toHaveBeenCalledWith('abc-123')
      })
    })

    test('successful registration closes modal', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
      const { findByLabelText, findByRole, queryByLabelText } = await openRegistrationModal()

      await fireEvent.update(await findByLabelText(/Registration Key/), 'valid-key')
      await fireEvent.click(await findByRole('button', { name: '__ok__' }))

      await waitFor(() => {
        expect(queryByLabelText(/Registration Key/)).not.toBeInTheDocument()
      })
    })

    test('failed registration shows failure message', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: false, message: 'Key is wrong' })
      const { findByLabelText, findByRole, findByText } = await openRegistrationModal()

      await fireEvent.update(await findByLabelText(/Registration Key/), 'bad-key')
      await fireEvent.click(await findByRole('button', { name: '__ok__' }))

      expect(await findByText('Key is wrong')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Session expired modal
  // -------------------------------------------------------------------------
  describe('session expired', () => {
    test('setting store.sessionExpired shows the session expired modal', async () => {
      const { store, findByText, findByRole } = renderAuthOrchestrator()

      store.sessionExpired = true
      await nextTick()

      expect(await findByText(/Your session has expired/)).toBeInTheDocument()
      expect(await findByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    test('store.sessionExpired is consumed (reset to false) after showing modal', async () => {
      const { store } = renderAuthOrchestrator()

      store.sessionExpired = true
      await nextTick()

      await waitFor(() => {
        expect(store.sessionExpired).toBe(false)
      })
    })

    test('Login button triggers performWebauthnLogin', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { store, findByRole } = renderAuthOrchestrator()

      store.sessionExpired = true
      await nextTick()

      await fireEvent.click(await findByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalledOnce()
      })
    })

    test('Cancel button hides the session expired modal', async () => {
      const { store, findByRole, queryByText } = renderAuthOrchestrator()

      store.sessionExpired = true
      await nextTick()

      await fireEvent.click(await findByRole('button', { name: 'Cancel' }))
      await nextTick()

      expect(queryByText(/Your session has expired/)).not.toBeInTheDocument()
    })

    test('successful login from session expired hides the modal', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { store, findByRole, queryByText } = renderAuthOrchestrator()

      store.sessionExpired = true
      await nextTick()

      await fireEvent.click(await findByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(queryByText(/Your session has expired/)).not.toBeInTheDocument()
      })
    })

    test('shows modal again when sessionExpired is set a second time after cancel', async () => {
      // Reproduces: after pressing Cancel on the session-expired modal and then
      // retrying a write that again gets 401, the modal must reappear.
      const { store, findByText, findByRole, queryByText } = renderAuthOrchestrator()

      // First expiry
      store.sessionExpired = true
      await nextTick()
      expect(await findByText(/Your session has expired/)).toBeInTheDocument()

      // User presses Cancel
      await fireEvent.click(await findByRole('button', { name: 'Cancel' }))
      await nextTick()
      expect(queryByText(/Your session has expired/)).not.toBeInTheDocument()

      // Second expiry (user retried the write without logging in)
      store.sessionExpired = true
      await nextTick()
      expect(await findByText(/Your session has expired/)).toBeInTheDocument()
    })
  })
})
