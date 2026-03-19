import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserLoginStore } from '@/stores/userlogin'

const mockFetch = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', mockFetch)

/**
 * Build a minimal Response-like object that satisfies the checks in updateUser / logout.
 */
function makeJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function makeErrorResponse(status: number): Response {
  return new Response('error', { status })
}

describe('useUserLoginStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch.mockReset()
  })

  // ---------------------------------------------------------------
  // loggedIn computed & username
  // ---------------------------------------------------------------
  describe('loggedIn', () => {
    test('is false when username is empty string', () => {
      const store = useUserLoginStore()
      expect(store.loggedIn).toBe(false)
    })

    test('is true when username is non-empty', () => {
      const store = useUserLoginStore()
      store.username = 'alice'
      expect(store.loggedIn).toBe(true)
    })
  })

  // ---------------------------------------------------------------
  // loginFailureModal helpers
  // ---------------------------------------------------------------
  describe('loginFailureModal', () => {
    test('starts as false', () => {
      const store = useUserLoginStore()
      expect(store.loginFailureModalVisible).toBe(false)
    })

    test('loginFailureTitle defaults to "Login failed"', () => {
      const store = useUserLoginStore()
      expect(store.loginFailureTitle).toBe('Login failed')
    })

    test('enableLoginFailureModal sets visible to true with default title', () => {
      const store = useUserLoginStore()
      store.enableLoginFailureModal()
      expect(store.loginFailureModalVisible).toBe(true)
      expect(store.loginFailureTitle).toBe('Login failed')
    })

    test('enableLoginFailureModal sets a custom title', () => {
      const store = useUserLoginStore()
      store.enableLoginFailureModal('Session expired')
      expect(store.loginFailureModalVisible).toBe(true)
      expect(store.loginFailureTitle).toBe('Session expired')
    })

    test('disableLoginFailureModal sets visible to false and resets title to default', () => {
      const store = useUserLoginStore()
      store.enableLoginFailureModal('Session expired')
      store.disableLoginFailureModal()
      expect(store.loginFailureModalVisible).toBe(false)
      expect(store.loginFailureTitle).toBe('Login failed')
    })
  })

  // ---------------------------------------------------------------
  // triggerLogin
  // ---------------------------------------------------------------
  describe('triggerLogin', () => {
    test('increments triggerLoginVar', () => {
      const store = useUserLoginStore()
      expect(store.triggerLoginVar).toBe(0)
      store.triggerLogin()
      expect(store.triggerLoginVar).toBe(1)
      store.triggerLogin()
      expect(store.triggerLoginVar).toBe(2)
    })
  })

  // ---------------------------------------------------------------
  // updateUser
  // ---------------------------------------------------------------
  describe('updateUser', () => {
    test('sets username when server returns userid', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ userid: 'alice' }))

      const store = useUserLoginStore()
      await store.updateUser()

      expect(store.username).toBe('alice')
      expect(store.loggedIn).toBe(true)
    })

    test('sets username to empty string when response has no userid field', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({}))

      const store = useUserLoginStore()
      store.username = 'alice'
      await store.updateUser()

      expect(store.username).toBe('')
      expect(store.loggedIn).toBe(false)
    })

    test('throws and clears username when response is not ok', async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(401))

      const store = useUserLoginStore()
      store.username = 'alice'
      await expect(store.updateUser()).rejects.toThrow('response not ok: status: 401')
      expect(store.username).toBe('')
    })

    test('throws and clears username when response body is not an object', async () => {
      mockFetch.mockResolvedValue(new Response('"just-a-string"', { status: 200 }))

      const store = useUserLoginStore()
      store.username = 'alice'
      await expect(store.updateUser()).rejects.toThrow(
        'Did not get back object from /api/v1/auth/user'
      )
      expect(store.username).toBe('')
    })

    test('throws and clears username when userid has wrong type', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ userid: 42 }))

      const store = useUserLoginStore()
      await expect(store.updateUser()).rejects.toThrow('userid has wrong type: number')
      expect(store.username).toBe('')
    })

    test('throws and clears username when fetch rejects', async () => {
      mockFetch.mockRejectedValue(new Error('network failure'))

      const store = useUserLoginStore()
      store.username = 'alice'
      await expect(store.updateUser()).rejects.toThrow('network failure')
      expect(store.username).toBe('')
    })
  })

  // ---------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------
  describe('logout', () => {
    test('calls the logout endpoint and then updateUser', async () => {
      // First call: logout endpoint succeeds
      // Second call: updateUser endpoint
      mockFetch
        .mockResolvedValueOnce(new Response(null, { status: 200 }))
        .mockResolvedValueOnce(makeJsonResponse({ userid: 'alice' }))

      const store = useUserLoginStore()
      store.username = 'alice'
      await store.logout()

      // Wait a tick for the finally updateUser().catch() to settle
      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      const firstCall = mockFetch.mock.calls[0]
      expect(firstCall?.[0]).toBe('/api/v1/auth/logout')
    })

    test('logs error when logout response is not ok but still calls updateUser', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      mockFetch
        .mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
        .mockResolvedValueOnce(makeJsonResponse({}))

      const store = useUserLoginStore()
      await store.logout()

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Logout was not successful')
      )
      consoleSpy.mockRestore()
    })

    test('logs error when fetch throws but still calls updateUser', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

      mockFetch
        .mockRejectedValueOnce(new Error('network down'))
        .mockResolvedValueOnce(makeJsonResponse({}))

      const store = useUserLoginStore()
      await store.logout()

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in logout procedure:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })
  })

  // ---------------------------------------------------------------
  // handleUnauthorized
  // ---------------------------------------------------------------
  describe('handleUnauthorized', () => {
    test('clears state and shows login modal when logged in', () => {
      const store = useUserLoginStore()
      store.username = 'alice'
      store.canWriteToSchema = true

      store.handleUnauthorized()

      expect(store.username).toBe('')
      expect(store.canWriteToSchema).toBe(false)
      expect(store.loginFailureModalVisible).toBe(true)
      expect(store.loginFailureTitle).toBe('Session expired')
    })

    test('does not show login modal when not logged in', () => {
      const store = useUserLoginStore()

      store.handleUnauthorized()

      expect(store.loginFailureModalVisible).toBe(false)
    })
  })

  // ---------------------------------------------------------------
  // session heartbeat
  // ---------------------------------------------------------------
  describe('session heartbeat', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('polls /session after one interval', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ authenticated: true, user: 'alice', expiresAt: null }))
      const store = useUserLoginStore()
      store.startSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/auth/session')
      store.stopSessionHeartbeat()
    })

    test('updates username when session is still active', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ authenticated: true, user: 'bob', expiresAt: null }))
      const store = useUserLoginStore()
      store.startSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(store.username).toBe('bob')
      store.stopSessionHeartbeat()
    })

    test('clears state and shows login modal when session expires while logged in', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ authenticated: false, user: null, expiresAt: null }))
      const store = useUserLoginStore()
      store.username = 'alice'
      store.startSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(store.username).toBe('')
      expect(store.loginFailureModalVisible).toBe(true)
      expect(store.loginFailureTitle).toBe('Session expired')
      store.stopSessionHeartbeat()
    })

    test('does not show login modal when session expires for unauthenticated user', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ authenticated: false, user: null, expiresAt: null }))
      const store = useUserLoginStore()
      store.startSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(store.loginFailureModalVisible).toBe(false)
      store.stopSessionHeartbeat()
    })

    test('leaves state unchanged on network error', async () => {
      mockFetch.mockRejectedValue(new Error('network failure'))
      const store = useUserLoginStore()
      store.username = 'alice'
      store.startSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(store.username).toBe('alice')
      expect(store.loginFailureModalVisible).toBe(false)
      store.stopSessionHeartbeat()
    })

    test('stopSessionHeartbeat stops polling', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ authenticated: true, user: 'alice', expiresAt: null }))
      const store = useUserLoginStore()
      store.startSessionHeartbeat()
      store.stopSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('startSessionHeartbeat is idempotent — only one interval runs', async () => {
      mockFetch.mockResolvedValue(makeJsonResponse({ authenticated: true, user: 'alice', expiresAt: null }))
      const store = useUserLoginStore()
      store.startSessionHeartbeat()
      store.startSessionHeartbeat()

      await vi.advanceTimersByTimeAsync(30_000)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      store.stopSessionHeartbeat()
    })
  })
})
