<template>
  <LoginFailureModal :visible="showLoginFailure" :message="loginErrorMessage" @retry="startLogin"
    @register="openRegistration" @cancel="showLoginFailure = false" />
  <SessionExpiredModal :visible="showSessionExpired" @login="handleSessionExpiredLogin"
    @cancel="showSessionExpired = false" />
  <RegistrationModal v-model:visible="showRegistration" @registered="onRegistered" />
</template>

<!--
  AuthOrchestrator — coordinates the authentication UI flow.

  Renders LoginFailureModal, SessionExpiredModal, and RegistrationModal as children.
  Owns all modal visibility state locally. Reacts to two store signals:
    - loginRequestCount: incremented by the navbar "Login" link → triggers WebAuthn login
    - sessionExpired: set by handleUnauthorized / session heartbeat → shows session-expired modal

  Usage: rendered once inside TrackManagerNavBar.
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { performWebauthnLogin } from '@/lib/auth/login'
import LoginFailureModal from '@/components/auth/LoginFailureModal.vue'
import SessionExpiredModal from '@/components/auth/SessionExpiredModal.vue'
import RegistrationModal from '@/components/auth/RegistrationModal.vue'

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

const showLoginFailure = ref(false)
const showSessionExpired = ref(false)
const showRegistration = ref(false)
const loginErrorMessage = ref("")

// React to login requests from the navbar (store.requestLogin() increments this)
watch(() => userLoginStore.loginRequestCount, async () => {
  await startLogin()
  await userLoginStore.updateUser()
})

// React to session expiry signals from the store (handleUnauthorized / heartbeat)
watch(() => userLoginStore.sessionExpired, (expired) => {
  if (expired) {
    showSessionExpired.value = true
    userLoginStore.sessionExpired = false
  }
})

async function startLogin() {
  const loginResult = await performWebauthnLogin()
  if (loginResult.success) {
    showLoginFailure.value = false
    showSessionExpired.value = false
  } else {
    if (loginResult.errorId === 'NotAllowedError') {
      loginErrorMessage.value = "Login was aborted or is not allowed."
    } else {
      loginErrorMessage.value = loginResult.message
    }
    showLoginFailure.value = true
  }
}

function openRegistration() {
  showLoginFailure.value = false
  showRegistration.value = true
}

async function handleSessionExpiredLogin() {
  showSessionExpired.value = false
  await startLogin()
  await userLoginStore.updateUser()
}

async function onRegistered() {
  await userLoginStore.updateUser()
}
</script>
