<script setup lang="ts">

import RegistrationForm from '@/components/auth/RegistrationForm.vue';
import TrackManagerNavBar from '@/components/TrackManagerNavBar.vue'
import LoginForm from '@/components/auth/LoginForm.vue';
import LogoutForm from '@/components/auth/LogoutForm.vue';
import { getWithCORS } from '@/lib/httpHelpers';

import { onMounted } from 'vue'

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

onMounted(() => {
  updateUser().catch((err) => {
    console.error(err)
  })
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps({
  sid: {
    type: String,
    default: ''
  }
})

async function updateUser() {
  try {
    const res = await getWithCORS('/api/v1/auth/user')
    if (res.ok) {
      const ro = await res.json() as unknown

      if (ro && typeof ro === 'object') {
        if ("userid" in ro) {
          userLoginStore.loggedIn = true
          if (typeof ro.userid === "string") {
            userLoginStore.username = ro.userid
          } else {
            throw Error("userid has wrong type: " + typeof ro.userid)
          }
        } else {
          userLoginStore.loggedIn = false
          userLoginStore.username = ""
        }
      } else {
        userLoginStore.loggedIn = false
        userLoginStore.username = ""
        throw Error("Did not get back object from /api/v1/auth/user")
      }
    } else {
      userLoginStore.loggedIn = false
      userLoginStore.username = ""
      throw Error(`response not ok: status: ${res.status}`)
    }
  } catch (error) {
    userLoginStore.loggedIn = false
    userLoginStore.username = ""
    throw error
  }
}

</script>

<template>
  <track-manager-nav-bar :sid="sid">
    <h1 class="mt-4 mb-4">
      Login
    </h1>

    <div class="container">
      <nav class="p-2 navbar bg-dark border-bottom border-bottom-dark" data-bs-theme="dark">
        <div class="navbar-brand">Webauthn</div>
        <div class="d-flex">
          <div class="mx-2 navbar-text">{{ userLoginStore.loggedIn ? userLoginStore.username : "Not signed in" }}</div>
        </div>
      </nav>
      <div>
        <RegistrationForm use-registration-key form-label="Register with registration key" place-holder="Key" />
        <LogoutForm v-if="userLoginStore.loggedIn" @changed="updateUser" />
        <LoginForm v-else @changed="updateUser" />
      </div>
    </div>
  </track-manager-nav-bar>
</template>