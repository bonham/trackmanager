<template>
  <BModal :model-value="visible" title="Session expired" @update:model-value="val => { if (!val) $emit('cancel') }">
    <p>Your session has expired. Please log in again.</p>
    <template #footer>
      <BButton class="mx-1" @click="$emit('login')">Login</BButton>
      <BButton class="mx-1" @click="$emit('cancel')">Cancel</BButton>
    </template>
  </BModal>
</template>

<!--
  SessionExpiredModal — presentational modal shown when a previously active session expires.

  Triggered by the store's sessionExpired signal (set by handleUnauthorized or session heartbeat).
  Props: visible.
  Emits: login (re-authenticate), cancel (dismiss).
  Intentionally separate from LoginFailureModal so buttons/messaging can evolve independently.
-->
<script setup lang="ts">
import { BModal, BButton } from 'bootstrap-vue-next'

defineProps<{
  visible: boolean
}>()

defineEmits<{
  'login': []
  'cancel': []
}>()
</script>
