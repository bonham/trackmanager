<template>
  <BModal v-model="userLoginStore.loginFailureModalVisible" title="Login failed">
    <div v-if="loginFailureMessage.length > 0">
      <div class="text-danger">{{ loginFailureMessage }}</div>
    </div>
    <template #footer>
      <BButton class="mx-1" @click="startLogin">Retry</BButton>
      <BButton class="mx-1" @click="openRegistrationModal">Register</BButton>
      <BButton class="mx-1" @click="userLoginStore.disableLoginFailureModal()">Cancel</BButton>
    </template>
  </BModal>
  <BModal v-model="registerModalVisible" title="Register" @ok.prevent @ok="processRegistration">
    <form>
      <div class="mb-3">
        <div v-if="registrationFailureMessage.length > 0">
          <div class="text-danger">Registration failed</div>
          <div class="text-danger">{{ registrationFailureMessage }}</div>
        </div>
        <label for="registration-key" class="col-form-label">Registration Key:</label>
        <input id="registration-key" v-model="registrationKey" type="text" class="form-control"
          :class="{ 'is-invalid': registrationKeyInvalid }">
      </div>
    </form>

  </BModal>
</template>

<script setup lang="ts">
import { BModal, BButton } from 'bootstrap-vue-next'
import { ref, watch } from 'vue'
import { performWebauthnLogin } from '@/lib/auth/login';
import { registerPasskey } from '@/lib/auth/registration';

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

const loginFailureMessage = ref("")
const registerModalVisible = ref(false)
const registrationKey = ref("")
const registrationKeyInvalid = ref(false)
const registrationFailureMessage = ref("")

const props = defineProps({
  performLogin: {
    type: Number,
    required: true,
  },
})

watch(() => props.performLogin, async () => {
  await startLogin()
  await userLoginStore.updateUser()
})

async function startLogin() {
  const loginResult = await performWebauthnLogin()
  if (loginResult.success) {
    userLoginStore.disableLoginFailureModal()

  } else {
    if (loginResult.errorId === 'NotAllowedError') {
      loginFailureMessage.value = "Login was aborted or is not allowed."
    } else
    // when login fails, then show modal
    {
      loginFailureMessage.value = loginResult.message
    }
    userLoginStore.enableLoginFailureModal()
  }
}

function openRegistrationModal() {
  userLoginStore.disableLoginFailureModal()
  registerModalVisible.value = true
}

async function processRegistration() {
  registrationKeyInvalid.value = false

  if (registrationKey.value === "") {
    registrationKeyInvalid.value = true
  } else {
    const registrationResult = await registerPasskey(registrationKey.value)
    registrationKey.value = ""
    if (registrationResult.success) {
      registerModalVisible.value = false
    } else {
      registrationFailureMessage.value = registrationResult.message
    }
  }
  await userLoginStore.updateUser()
}

</script>
