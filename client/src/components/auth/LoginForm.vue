<script setup lang="ts">

import { ref } from 'vue'
import { getWithCORS, sendJSONToServer, getErrorMessage } from '@/lib/httpHelpers';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types'
import type { VerifiedAuthenticationResponse, } from '@simplewebauthn/server'

import { useUserLoginStore } from '@/stores/userlogin'
const userLoginStore = useUserLoginStore()

const loginstatus = ref("")

async function handleLogin() {
  try {
    await handleLoginWorker()
  } catch (e) {
    console.error("Error in authentication procedure", e)
    loginstatus.value = getErrorMessage(e)
  } finally {
    await userLoginStore.updateUser()
  }
}

async function handleLoginWorker() {

  loginstatus.value = ""
  const authoptionsUrl = "/api/v1/auth/authoptions"

  const resp = await getWithCORS(authoptionsUrl);

  if (!resp.ok) {
    const t = await resp.text()
    loginstatus.value = t
    return
  }

  const regoptions = await resp.json() as PublicKeyCredentialCreationOptionsJSON

  // Pass the options to the authenticator and wait for a response
  const asseResp = await startAuthentication(regoptions);

  // POST the response to the endpoint that calls
  // @simplewebauthn/server -> verifyAuthenticationResponse()
  const verificationResp = await sendJSONToServer('/api/v1/auth/authentication', JSON.stringify(asseResp))
  if (!verificationResp.ok) {
    if (verificationResp.status === 401) {
      loginstatus.value = "You are not authorized. Try another passkey"
    } else {
      loginstatus.value = `Sorry, something went wrong. Return status ${verificationResp.status}`
      console.log(`Verification failed with response:`, verificationResp)
    }
    return
  }

  // Wait for the results of verification
  const verificationJSON = await verificationResp.json() as VerifiedAuthenticationResponse;
  console.log("verificationJson:", verificationJSON)

  // Show UI appropriate for the `verified` status
  if (verificationJSON && verificationJSON.verified) {

    loginstatus.value = 'Success!';

  } else {
    loginstatus.value = `Oh no, something went wrong! Response: ${JSON.stringify(
      verificationJSON,
    )}`;
  }
};

</script>
<template>
  <div class="border border-secondary-subtle p-3 mb-2 mt-2">
    <button class="btn btn-secondary" @click="handleLogin">Sign in with passkey</button>
    <div v-if="loginstatus" class="mt-2">Status: {{ loginstatus }}</div>
  </div>
</template>