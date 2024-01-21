<script setup lang="ts">

import RegistrationForm from '@/components/auth/RegistrationForm.vue';
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import LoginForm from '@/components/auth/LoginForm.vue';
import LogoutForm from '@/components/auth/LogoutForm.vue';

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

</script>

<template>
  <track-manager-nav-bar :sid="sid">
    <div class="container mt-2">
      <div v-if="userLoginStore.loggedIn" class="border border-secondary-subtle p-3 mb-2 mt-2">
        {{ userLoginStore.loggedIn ? `Username: ${userLoginStore.username}` : "Not signed in " }}
      </div>
      <div>
        <LogoutForm v-if="userLoginStore.loggedIn" />
        <LoginForm v-else />
      </div>
      <div>
        <RegistrationForm use-registration-key form-label="Register with registration key" place-holder="Key" />
      </div>
    </div>
  </track-manager-nav-bar>
</template>