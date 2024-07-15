import { getWithCORS, sendJSONToServer, getErrorMessage } from '@/lib/httpHelpers';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types'
import type { VerifiedAuthenticationResponse, } from '@simplewebauthn/server'

interface LoginHandlerStatus {
  success: boolean,
  message: string
}

export async function performWebauthnLogin(): Promise<LoginHandlerStatus> {

  const authoptionsUrl = "/api/v1/auth/authoptions"
  const returnStatus: LoginHandlerStatus = { success: false, message: "unknown" }

  try {
    const resp = await getWithCORS(authoptionsUrl);

    if (!resp.ok) {
      const text = await resp.text()
      returnStatus.success = false
      returnStatus.message = `Http status: ${resp.status}, Body: ${text}`
      return returnStatus
    }

    const authoptions = await resp.json() as PublicKeyCredentialCreationOptionsJSON

    // Pass the options to the authenticator and wait for a response
    const asseResp = await startAuthentication(authoptions);

    // POST the response to the endpoint that calls
    // @simplewebauthn/server -> verifyAuthenticationResponse()
    const verificationResp = await sendJSONToServer('/api/v1/auth/authentication', JSON.stringify(asseResp))
    if (!verificationResp.ok) {
      if (verificationResp.status === 401) {
        returnStatus.success = false
        returnStatus.message = "You are not authorized. Try another passkey"
      } else {
        returnStatus.success = false
        returnStatus.message = `Sorry, something went wrong. Return status ${verificationResp.status}`
        console.log(`Verification failed with response:`, verificationResp)
      }
      return returnStatus
    }

    // Wait for the results of verification
    const verificationJSON = await verificationResp.json() as VerifiedAuthenticationResponse;
    // console.log("verificationJson:", verificationJSON)

    // Show UI appropriate for the `verified` status
    if (verificationJSON && verificationJSON.verified) {

      returnStatus.success = true;
      returnStatus.message = ""

    } else {
      returnStatus.success = false
      returnStatus.message = `Oh no, something went wrong! Response: ${JSON.stringify(
        verificationJSON,
      )}`;
    }
    return returnStatus
  } catch (e) {
    console.log("Error when trying to log in.", e)
    returnStatus.success = false
    returnStatus.message = getErrorMessage(e)
    return returnStatus
  }

};