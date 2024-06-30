<script setup lang="ts">

import { getWithCORS, sendJSONToServer, getErrorMessage } from '@/lib/httpHelpers';
import { ref } from 'vue'
import { startRegistration } from '@simplewebauthn/browser';
import type { VerifiedRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types'

const props = defineProps({
  useRegistrationKey: Boolean,
  formLabel: {
    type: String,
    default: ''
  },
  placeHolder: {
    type: String,
    default: ''
  },
})

const regstatus = ref("None")
const registrationToken = ref("")
const registerNicknameFieldInValid = ref(false)

async function handleCreate() {

  // User pressing Enter without entering a registration key
  if (registrationToken.value == "") {
    registerNicknameFieldInValid.value = true
    return
  }

  // GET registration options from the endpoint that calls
  // @simplewebauthn/server -> generateRegistrationOptions()
  let regOptionsUrl: string
  if (props.useRegistrationKey) {
    regOptionsUrl = '/api/v1/auth/regoptions/regkey/' + registrationToken.value
  } else {
    regOptionsUrl = '/api/v1/auth/regoptions/username/' + registrationToken.value
  }

  let resp: Response
  try {
    resp = await getWithCORS(regOptionsUrl);

    if (!resp.ok) {
      regstatus.value = "Failed"
      console.log(`Registration failed with status ${resp.status}`)
      return
    }

  } catch (error) {
    regstatus.value = getErrorMessage(error)
    return
  }

  const regoptions = await resp.json() as PublicKeyCredentialCreationOptionsJSON

  let attResp: RegistrationResponseJSON;
  try {
    // Pass the options to the authenticator and wait for a response
    attResp = await startRegistration(regoptions);
  } catch (error) {

    if (error instanceof Error) {
      // Some basic error handling
      if (error.name === 'InvalidStateError') {
        regstatus.value = 'Authenticator was probably already registered by user';
        return
      } else {
        console.error(getErrorMessage(error))
        regstatus.value = "Failed on client side";
        return
      }
    } else {
      console.error(getErrorMessage(error))
      regstatus.value = "Failed on client side (2)"
      return
    }
  }

  // POST the response to the endpoint that calls
  // @simplewebauthn/server -> verifyRegistrationResponse()
  let verificationResp: Response
  try {
    verificationResp = await sendJSONToServer('/api/v1/auth/register', JSON.stringify(attResp));
    if (!verificationResp.ok) {
      const st = verificationResp.status
      const body = await verificationResp.text()

      console.log(`Verification failed with status ${st} and body ${body}`)
      console.log(`attResp: `, attResp)
      regstatus.value = "Failed"
      return
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    console.log("Error when calling registration endpoint: " + msg);
    regstatus.value = "Failed"
    return
  }

  // Wait for the results of verification
  const verificationJSON = await verificationResp.json() as VerifiedRegistrationResponse;
  console.log("verificationJson:", verificationJSON)

  // Show UI appropriate for the `verified` status
  if (verificationJSON && verificationJSON.verified) {
    regstatus.value = 'Success!';
  } else {
    regstatus.value = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
      verificationJSON,
    )}</pre>`;
  }
}

</script>
<template>
  <div class="border border-secondary-subtle p-3 mb-2 mt-2">
    <label :for="placeHolder" class="form-label">{{ formLabel }}</label>
    <div class="input-group">
      <input :id="placeHolder" v-model="registrationToken" type="text"
        :class="{ 'is-invalid': registerNicknameFieldInValid }" class="form-control" :placeholder="placeHolder"
        aria-label="Nickname" aria-describedby="button-addon2" autocomplete="off">
      <button id="button-addon2" class="btn btn-outline-secondary" type="button" @click="handleCreate">Register</button>
    </div>
    <div v-if="regstatus !== 'None'" class="mt-2">Status: {{ regstatus }}</div>
  </div>
</template>