import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SESSION_HEARTBEAT_INTERVAL_MS = 30_000

export const useUserLoginStore = defineStore('userlogin', () => {

  // Not logged in: username is empty string
  const username = ref("")

  // return true if username is longer than empty string
  const loggedIn = computed(() => {
    return (username.value.length > 0)
  })

  const canWriteToSchema = ref(false)

  async function checkWritePermission(sid: string) {
    if (!sid) { canWriteToSchema.value = false; return }
    try {
      const res = await fetch(`/api/tracks/canwrite/sid/${sid}`)
      canWriteToSchema.value = res.ok
    } catch {
      canWriteToSchema.value = false
    }
  }

  // relay variable to trigger and listen to login requests. Should be incremented to trigger.
  const loginFailureModalVisible = ref(false)
  const loginFailureTitle = ref('Login failed')

  function enableLoginFailureModal(title = 'Login failed') {
    loginFailureTitle.value = title
    loginFailureModalVisible.value = true
  }

  function disableLoginFailureModal() {
    loginFailureModalVisible.value = false
    loginFailureTitle.value = 'Login failed'
  }

  const triggerLoginVar = ref(0)
  function triggerLogin() {
    triggerLoginVar.value++
  }

  async function updateUser() {
    try {
      const res = await fetch('/api/v1/auth/user')
      if (res.ok) {
        const ro = await res.json() as unknown

        if (ro && typeof ro === 'object') {
          if ("userid" in ro) {
            if (typeof ro.userid === "string") {
              username.value = ro.userid
            } else {
              throw Error("userid has wrong type: " + typeof ro.userid)
            }
          } else {
            username.value = ""
          }
        } else {
          username.value = ""
          throw Error("Did not get back object from /api/v1/auth/user")
        }
      } else {
        username.value = ""
        throw Error(`response not ok: status: ${res.status}`)
      }
    } catch (error) {
      username.value = ""
      throw error
    }
  }

  async function logout() {

    const logoutUrl = "/api/v1/auth/logout"

    try {
      const resp = await fetch(logoutUrl);

      if (!resp.ok) {
        const t = await resp.text()
        console.error(`Logout was not successful. Response status:${resp.status}, Body:${t}`)
      }
    } catch (e) {
      console.error("Error in logout procedure:", e)
    } finally {
      canWriteToSchema.value = false
      updateUser().catch((e) => { console.log(e) })
    }
  };

  // Called when an API response returns 401/403 — clears local state and prompts re-auth.
  function handleUnauthorized() {
    const wasLoggedIn = username.value.length > 0
    username.value = ''
    canWriteToSchema.value = false
    if (wasLoggedIn) {
      enableLoginFailureModal('Session expired')
    }
  }

  // Session heartbeat: periodically calls /session to detect server-side expiry.
  let _heartbeatTimer: ReturnType<typeof setInterval> | null = null

  async function _checkSession() {
    try {
      const res = await fetch('/api/v1/auth/session')
      if (!res.ok) return
      const data = await res.json() as { authenticated: boolean; user: string | null; expiresAt: number | null }

      const wasLoggedIn = username.value.length > 0

      if (data.authenticated && data.user) {
        username.value = data.user
      } else {
        username.value = ''
        canWriteToSchema.value = false
      }

      if (wasLoggedIn && !data.authenticated) {
        enableLoginFailureModal('Session expired')
      }
    } catch {
      // Network error — leave current state unchanged
    }
  }

  function startSessionHeartbeat() {
    if (_heartbeatTimer !== null) return
    _heartbeatTimer = setInterval(() => { void _checkSession() }, SESSION_HEARTBEAT_INTERVAL_MS)
  }

  function stopSessionHeartbeat() {
    if (_heartbeatTimer !== null) {
      clearInterval(_heartbeatTimer)
      _heartbeatTimer = null
    }
  }

  return {
    loggedIn,
    username,
    updateUser,
    logout,
    canWriteToSchema,
    checkWritePermission,
    loginFailureModalVisible,
    loginFailureTitle,
    enableLoginFailureModal,
    disableLoginFailureModal,
    triggerLoginVar,
    triggerLogin,
    handleUnauthorized,
    startSessionHeartbeat,
    stopSessionHeartbeat,
  }

})
