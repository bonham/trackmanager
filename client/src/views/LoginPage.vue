<script lang="ts" setup>
import { ref } from 'vue'

import RegistrationForm from '@/components/auth/RegistrationForm.vue';
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import { BContainer } from 'bootstrap-vue-next';
import LoginForm from '@/components/auth/LoginForm.vue';
import LogoutForm from '@/components/auth/LogoutForm.vue';
import { getWithCORS } from '@/lib/httpHelpers';

import { onMounted } from 'vue'

onMounted(() => {
  updateUser()
})

const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

const username = ref("")

async function updateUser() {
  try {
    const res = await getWithCORS('/api/v1/auth/user')
    if (res.ok) {
      const ro = await res.json()
      username.value = ro.userid ? ro.userid : "" // convert from undefined to string
    } else {
      console.error(`Could not fetch user. Response status ${res.status}`)
      username.value = "- Error -"
    }
  } catch (error) {
    console.log("Could not fetch user", error)
    username.value = "Error"
  }
}

</script>

<template>
  <b-container id="root" class="d-flex flex-column vh-100">
    <track-manager-nav-bar :sid="sid" />
    <h1 class="mt-4 mb-4">
      Login
    </h1>

    <div class="container">
      <nav class="p-2 navbar bg-dark border-bottom border-bottom-dark" data-bs-theme="dark">
        <div class="navbar-brand">Webauthn</div>
        <div class="d-flex">
          <div class="mx-2 navbar-text">{{ username ? username : "Not signed on" }}</div>
        </div>
      </nav>
      <div>
        <RegistrationForm form-label="Register with username" place-holder="Username" />
        <RegistrationForm use-registration-key form-label="Register with registration key" place-holder="Key" />
        <LogoutForm v-if="username" @changed="updateUser" />
        <LoginForm v-else @changed="updateUser" />
      </div>
    </div>
  </b-container>
</template>