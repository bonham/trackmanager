import { getWithCORS, sendJSONToServer, getErrorMessage } from '@/lib/httpHelpers';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser'

interface LoginHandlerStatus {
  success: boolean,
  message: string,
  errorId?: string
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
    const asseResp = await startAuthentication({ optionsJSON: authoptions }); // hier kommt cred id als binary in antwort ?? wirklich ?? QXfYW3y2xvMfXFfd1-QTWqCIeeF01x0FQ1puJ6J-ND8

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
    const verificationJSON = await verificationResp.json() as unknown;

    // Show UI appropriate for the `verified` status
    if (verificationJSON && (typeof verificationJSON === 'object') && ('verified' in verificationJSON) && verificationJSON.verified) {

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
    console.log("Error when trying to log in:", e)
    returnStatus.success = false
    if (
      e &&
      typeof e === 'object' &&
      'name' in e &&
      e.name === "NotAllowedError"
    ) {
      returnStatus.errorId = e.name
    }
    returnStatus.message = getErrorMessage(e)
    return returnStatus
  }

};