<template>
  <div class="border border-secondary-subtle p-3 mb-2 mt-2">
    <label for="regKey" class="form-label">Registration key</label>
    <div class="input-group">
      <input id="regKey" v-model="registrationToken" type="text" :class="{ 'is-invalid': registerNicknameFieldInValid }"
        class="form-control" aria-label="Nickname" aria-describedby="button-addon2" autocomplete="off">
      <button id="button-addon2" class="btn btn-outline-secondary" type="button" @click="handleCreate">Register</button>
    </div>
    <div v-if="regstatus !== 'None'" class="mt-2">Status: {{ regstatus }}</div>
  </div>
</template>

<script setup lang="ts">

import { ref } from 'vue'
import { registerPasskey } from '@/lib/auth/registration';

const regstatus = ref("None")
const registrationToken = ref("")
const registerNicknameFieldInValid = ref(false)

async function handleCreate() {
  // User pressing Enter without entering a registration key
  if (registrationToken.value == "") {
    registerNicknameFieldInValid.value = true
    return
  } else {
    const registrationResult = await registerPasskey(registrationToken.value)
    if (registrationResult.success === true) {
      regstatus.value = "Success"
    } else {
      regstatus.value = registrationResult.message
    }
  }
}

</script>
