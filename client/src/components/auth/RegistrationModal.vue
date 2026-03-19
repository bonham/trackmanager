<template>
  <BModal v-model="localVisible" title="Register" @ok.prevent @ok="processRegistration">
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

<!--
  RegistrationModal — self-contained passkey registration form.

  Owns its form state (registration key, validation, error messages) and calls registerPasskey().
  Props: visible (v-model pattern via update:visible).
  Emits: update:visible (close), registered (successful registration).
  Opened from AuthOrchestrator when user clicks "Register" in the login failure modal.
-->
<script setup lang="ts">
import { BModal } from 'bootstrap-vue-next'
import { ref, computed } from 'vue'
import { registerPasskey } from '@/lib/auth/registration'
import { useUserLoginStore } from '@/stores/userlogin'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'registered': []
}>()

const localVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

const registrationKey = ref("")
const registrationKeyInvalid = ref(false)
const registrationFailureMessage = ref("")

async function processRegistration() {
  registrationKeyInvalid.value = false

  if (registrationKey.value === "") {
    registrationKeyInvalid.value = true
  } else {
    const registrationResult = await registerPasskey(registrationKey.value)
    registrationKey.value = ""
    if (registrationResult.success) {
      localVisible.value = false
      emit('registered')
    } else {
      registrationFailureMessage.value = registrationResult.message
    }
  }
  await useUserLoginStore().updateUser()
}
</script>
