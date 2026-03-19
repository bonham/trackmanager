<template>
  <BModal :model-value="visible" title="Login failed" @update:model-value="val => { if (!val) $emit('cancel') }">
    <div v-if="message.length > 0">
      <div class="text-danger">{{ message }}</div>
    </div>
    <template #footer>
      <BButton class="mx-1" @click="$emit('retry')">Retry</BButton>
      <BButton class="mx-1" @click="$emit('register')">Register</BButton>
      <BButton class="mx-1" @click="$emit('cancel')">Cancel</BButton>
    </template>
  </BModal>
</template>

<!--
  LoginFailureModal — presentational modal shown after a failed WebAuthn login attempt.

  Props: visible, message (error text to display).
  Emits: retry (re-attempt login), register (open registration), cancel (dismiss).
  Contains no business logic; parent (AuthOrchestrator) handles all actions.
-->
<script setup lang="ts">
import { BModal, BButton } from 'bootstrap-vue-next'

defineProps<{
  visible: boolean
  message: string
}>()

defineEmits<{
  'retry': []
  'register': []
  'cancel': []
}>()
</script>
