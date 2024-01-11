<script setup lang="ts">

import { ref } from 'vue'
import { getWithCORS, sendJSONToServer, getErrorMessage } from '@/lib/httpHelpers';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/typescript-types'
import type { VerifiedAuthenticationResponse, } from '@simplewebauthn/server'

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

const emit = defineEmits(['changed'])

const loginstatus = ref("")

async function handleLogin() {

  loginstatus.value = ""
  userLoginStore.loggedIn = false

  const authoptionsUrl = "/api/v1/auth/authoptions"

  let resp: Response
  try {
    resp = await getWithCORS(authoptionsUrl);
  } catch (error) {
    loginstatus.value = getErrorMessage(error)
    userLoginStore.loggedIn = false
    emit('changed')
    return
  }
  if (!resp.ok) {
    const t = await resp.text()
    loginstatus.value = t
    userLoginStore.loggedIn = false
    emit('changed')
    return
  }

  const regoptions = await resp.json() as PublicKeyCredentialCreationOptionsJSON

  let asseResp;
  try {
    // Pass the options to the authenticator and wait for a response
    asseResp = await startAuthentication(regoptions);
  } catch (error) {
    // Some basic error handling
    loginstatus.value = "Start Auth error: " + String(error);
    userLoginStore.loggedIn = false

    emit('changed')
    return
  }

  // POST the response to the endpoint that calls
  // @simplewebauthn/server -> verifyAuthenticationResponse()
  let verificationResp: Response
  try {
    verificationResp = await sendJSONToServer('/api/v1/auth/authentication', JSON.stringify(asseResp))
    if (!verificationResp.ok) {
      console.log(`Verification failed with response:`, verificationResp)
      loginstatus.value = "Failed"
      userLoginStore.loggedIn = false
      emit('changed')
      return
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    console.log("Error when calling registration endpoint: " + msg);
    loginstatus.value = "Failed"
    userLoginStore.loggedIn = false
    emit('changed')
    return
  }

  // Wait for the results of verification
  const verificationJSON = await verificationResp.json() as VerifiedAuthenticationResponse;
  console.log("verificationJson:", verificationJSON)

  // Show UI appropriate for the `verified` status
  if (verificationJSON && verificationJSON.verified) {

    loginstatus.value = 'Success!';
    userLoginStore.loggedIn = true

  } else {
    loginstatus.value = `Oh no, something went wrong! Response: ${JSON.stringify(
      verificationJSON,
    )}`;
    userLoginStore.loggedIn = false
  }
  emit('changed')
};

</script>
<template>
  <div class="border border-secondary-subtle p-3 mb-2 mt-2">
    <button class="btn btn-secondary" @click="handleLogin">Sign in with passkey</button>
    <div v-if="loginstatus" class="mt-2">Status: {{ loginstatus }}</div>
  </div>
</template>