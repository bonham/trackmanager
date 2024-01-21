<script setup lang="ts">

import { ref } from 'vue'

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

const logoutstatus = ref("")

</script>
<template>
  <div class="border border-secondary-subtle p-3 mb-2 mt-2">
    <button class="btn btn-secondary" @click="userLoginStore.logout()">Logout</button>
    <div v-if="logoutstatus">Status: {{ logoutstatus }}</div>
  </div>
</template>