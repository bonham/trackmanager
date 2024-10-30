import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserLoginStore = defineStore('userlogin', () => {

  // Not logged in: username is empty string
  const username = ref("")

  // return true if username is longer than empty string
  const loggedIn = computed(() => {
    return (username.value.length > 0)
  })

  // relay variable to trigger and listen to login requests. Should be incremented to trigger.
  const loginFailureModalVisible = ref(false)

  function enableLoginFailureModal() {
    loginFailureModalVisible.value = true
  }

  function disableLoginFailureModal() {
    loginFailureModalVisible.value = false
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
      updateUser().catch((e) => { console.log(e) })
    }
  };


  return {
    loggedIn,
    username,
    updateUser,
    logout,
    loginFailureModalVisible,
    enableLoginFailureModal,
    disableLoginFailureModal,
    triggerLoginVar,
    triggerLogin
  }

})

