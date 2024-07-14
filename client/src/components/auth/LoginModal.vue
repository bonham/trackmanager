<template>
  <BModal v-model="loginModalVisible" title="Failure">
    <p>Login Failed</p>
    <template #footer>
      <BButton class="mx-1" @click="retryLogin">Retry</BButton>
      <BButton class="mx-1" @click="register">Register</BButton>
      <BButton class="mx-1" @click="loginModalVisible = false">Cancel</BButton>
    </template>
  </BModal>
  <BModal v-model="registerModalVisible" title="Register">
    <form>
      <div class="mb-3">
        <label for="registration-key" class="col-form-label">Registration Key:</label>
        <input id="registration-key" type="text" class="form-control">
      </div>
    </form>

  </BModal>
</template>

<script setup lang="ts">
import { BModal, BButton } from 'bootstrap-vue-next'
import { ref, watch } from 'vue'

const loginModalVisible = ref(false)
const registerModalVisible = ref(false)

const props = defineProps({
  performLogin: {
    type: Number,
    required: true,
  },
})

watch(() => props.performLogin, (newValue) => {
  console.log(`Performlogin: ${newValue}`)
  loginModalVisible.value = true
})

function retryLogin() {
  console.log("retry")
}

function register() {
  loginModalVisible.value = false
  registerModalVisible.value = true
}

</script>
