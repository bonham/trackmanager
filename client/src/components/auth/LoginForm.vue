<script setup lang="ts">

import { ref } from 'vue'
import { getErrorMessage } from '@/lib/httpHelpers';
import { performWebauthnLogin } from '@/lib/auth/login';

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

const loginFailure = ref(false)
const loginMessage = ref("")

async function handleLogin() {
  try {
    const loginResult = await performWebauthnLogin()
    loginFailure.value = !loginResult.success
    loginMessage.value = loginResult.message

  } catch (e) {
    console.error("Error in authentication procedure", e)
    loginFailure.value = true
    loginMessage.value = getErrorMessage(e)
  } finally {
    await userLoginStore.updateUser()
  }
}

</script>
<template>
  <div class="border border-secondary-subtle p-3 mb-2 mt-2">
    <button class="btn btn-secondary" @click="handleLogin">Sign in with passkey</button>
    <div v-if="loginFailure" class="mt-2">Status: {{ loginMessage }}</div>
  </div>
</template>