import { render, fireEvent, waitFor } from '@testing-library/vue'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import LoginModal from '@/components/auth/LoginModal.vue'
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
    // Pass the native click event through $emit('ok', $event) so that Vue's
    // withModifiers wrapper for @ok.prevent can call $event.preventDefault()
    // without receiving undefined and throwing a TypeError.
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

/** Stub fetch so the real updateUser/logout actions don't blow up in jsdom. */
const mockFetch = vi.fn<typeof fetch>()

function makeFetchResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

/**
 * Render LoginModal with a real Pinia (stubActions: false) so that store
 * actions like disableLoginFailureModal / enableLoginFailureModal actually
 * mutate state, making the BModal v-model conditions work correctly.
 */
function renderLoginModal() {
  // Each test gets a fresh Pinia with real actions
  const pinia = createTestingPinia({ stubActions: false })
  const result = render(LoginModal, { global: { plugins: [pinia] } })
  const store = useUserLoginStore(pinia)
  return { ...result, store }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default fetch stub: updateUser receives an empty userid → loggedIn = false
    mockFetch.mockResolvedValue(makeFetchResponse({ userid: '' }))
    vi.stubGlobal('fetch', mockFetch)
  })

  // -------------------------------------------------------------------------
  // Smoke
  // -------------------------------------------------------------------------
  test('mounts without errors', () => {
    const { container } = renderLoginModal()
    expect(container).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // Login failure modal – Retry button
  // -------------------------------------------------------------------------
  describe('login failure modal', () => {
    async function openLoginModal() {
      const ctx = renderLoginModal()
      // Make the login-failure BModal visible by setting store state directly
      ctx.store.loginFailureModalVisible = true
      await nextTick()
      return ctx
    }

    test('shows modal content when loginFailureModalVisible is true', async () => {
      const { getByRole } = await openLoginModal()
      expect(getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      expect(getByRole('button', { name: 'Register' })).toBeInTheDocument()
      expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })

    test('Retry button calls performWebauthnLogin', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { getByRole } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Retry' }))

      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalledOnce()
      })
    })

    test('successful login hides the modal', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { getByRole, queryByRole, store } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Retry' }))

      await waitFor(() => {
        expect(store.loginFailureModalVisible).toBe(false)
        expect(queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      })
    })

    test('failed login with NotAllowedError shows abort message', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({
        success: false,
        message: 'technical detail',
        errorId: 'NotAllowedError',
      })
      const { getByRole, findByText } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Retry' }))

      expect(await findByText('Login was aborted or is not allowed.')).toBeInTheDocument()
    })

    test('failed login with other error shows the error message', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({
        success: false,
        message: 'Authenticator unavailable',
      })
      const { getByRole, findByText } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Retry' }))

      expect(await findByText('Authenticator unavailable')).toBeInTheDocument()
    })

    test('failed login keeps modal visible', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: false, message: 'Nope' })
      const { getByRole, store } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Retry' }))

      await waitFor(() => {
        expect(store.loginFailureModalVisible).toBe(true)
      })
    })

    test('Cancel button hides the modal', async () => {
      const { getByRole, queryByRole, store } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Cancel' }))

      await nextTick()
      expect(store.loginFailureModalVisible).toBe(false)
      expect(queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    })

    test('Register button hides login modal and shows registration modal', async () => {
      const { getByRole, queryByRole, findByLabelText } = await openLoginModal()

      await fireEvent.click(getByRole('button', { name: 'Register' }))

      await nextTick()
      // Login modal should close (loginFailureModalVisible set to false)
      expect(queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
      // Registration key input should appear
      expect(await findByLabelText(/Registration Key/)).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // Registration modal – processRegistration
  // -------------------------------------------------------------------------
  describe('registration modal', () => {
    /** Open the login modal, then click Register to get to the reg modal. */
    async function openRegistrationModal() {
      const ctx = renderLoginModal()
      ctx.store.loginFailureModalVisible = true
      await nextTick()

      await fireEvent.click(ctx.getByRole('button', { name: 'Register' }))
      await nextTick()

      return ctx
    }

    test('shows registration key input', async () => {
      const { findByLabelText } = await openRegistrationModal()
      expect(await findByLabelText(/Registration Key/)).toBeInTheDocument()
    })

    test('empty key marks input as invalid', async () => {
      const { findByRole } = await openRegistrationModal()

      const okButton = await findByRole('button', { name: '__ok__' })
      await fireEvent.click(okButton)

      await waitFor(() => {
        const input = document.getElementById('registration-key')
        expect(input).toHaveClass('is-invalid')
      })
    })

    test('valid key calls registerPasskey with the key value', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
      const { findByLabelText, findByRole } = await openRegistrationModal()

      const input = await findByLabelText(/Registration Key/)
      await fireEvent.update(input, 'abc-123')

      const okButton = await findByRole('button', { name: '__ok__' })
      await fireEvent.click(okButton)

      await waitFor(() => {
        expect(mockRegisterPasskey).toHaveBeenCalledWith('abc-123')
      })
    })

    test('successful registration clears the key and closes modal', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: true, message: '' })
      const { findByLabelText, findByRole, queryByLabelText } = await openRegistrationModal()

      const input = await findByLabelText(/Registration Key/)
      await fireEvent.update(input, 'valid-key')

      const okButton = await findByRole('button', { name: '__ok__' })
      await fireEvent.click(okButton)

      await waitFor(() => {
        // Modal closes (v-model becomes false) – input no longer in DOM
        expect(queryByLabelText(/Registration Key/)).not.toBeInTheDocument()
      })
    })

    test('failed registration shows failure message', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: false, message: 'Key is wrong' })
      const { findByLabelText, findByRole, findByText } = await openRegistrationModal()

      const input = await findByLabelText(/Registration Key/)
      await fireEvent.update(input, 'bad-key')

      const okButton = await findByRole('button', { name: '__ok__' })
      await fireEvent.click(okButton)

      expect(await findByText('Key is wrong')).toBeInTheDocument()
    })

    test('failed registration shows "Registration failed" label', async () => {
      mockRegisterPasskey.mockResolvedValue({ success: false, message: 'Some error' })
      const { findByLabelText, findByRole, findByText } = await openRegistrationModal()

      await fireEvent.update(await findByLabelText(/Registration Key/), 'bad-key')
      await fireEvent.click(await findByRole('button', { name: '__ok__' }))

      expect(await findByText('Registration failed')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------------------------
  // triggerLoginVar watcher
  // -------------------------------------------------------------------------
  describe('triggerLoginVar watcher', () => {
    test('incrementing triggerLoginVar triggers startLogin', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { store } = renderLoginModal()

      store.triggerLoginVar++
      await nextTick()

      await waitFor(() => {
        expect(mockPerformWebauthnLogin).toHaveBeenCalledOnce()
      })
    })

    test('watcher result: successful login hides the failure modal', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: true, message: '' })
      const { store } = renderLoginModal()

      // Make the modal visible first so we can observe it being hidden
      store.loginFailureModalVisible = true
      await nextTick()

      store.triggerLoginVar++
      await nextTick()

      await waitFor(() => {
        expect(store.loginFailureModalVisible).toBe(false)
      })
    })

    test('watcher result: failed login shows failure modal', async () => {
      mockPerformWebauthnLogin.mockResolvedValue({ success: false, message: 'Watch error' })
      const { store } = renderLoginModal()

      store.triggerLoginVar++
      await nextTick()

      await waitFor(() => {
        expect(store.loginFailureModalVisible).toBe(true)
      })
    })
  })
})
