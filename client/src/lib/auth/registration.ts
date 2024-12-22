
import { getWithCORS, sendJSONToServer, getErrorMessage } from '@/lib/httpHelpers';
import { startRegistration } from '@simplewebauthn/browser';
import type { VerifiedRegistrationResponse } from '@simplewebauthn/server'
import type { RegistrationResponseJSON, PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types'

interface RegistrationHandlerStatus {
  success: boolean,
  message: string
}

export async function registerPasskey(registrationKey: string): Promise<RegistrationHandlerStatus> {

  const returnStatus: RegistrationHandlerStatus = { success: false, message: "unknown" }

  // GET registration options from the endpoint that calls
  // @simplewebauthn/server -> generateRegistrationOptions()

  const regOptionsUrl = '/api/v1/auth/regoptions/regkey/' + registrationKey

  let resp: Response
  try {
    resp = await getWithCORS(regOptionsUrl);

    if (!resp.ok) {
      returnStatus.success = false
      returnStatus.message = `Registration failed with status ${resp.status}`
      return returnStatus
    }

  } catch (error) {
    returnStatus.message = getErrorMessage(error)
    returnStatus.success = false
    return returnStatus
  }

  const regoptions = await resp.json() as PublicKeyCredentialCreationOptionsJSON

  let attResp: RegistrationResponseJSON;
  try {
    // Pass the options to the authenticator and wait for a response
    attResp = await startRegistration({ optionsJSON: regoptions });
  } catch (error) {

    if (error instanceof Error) {
      // Some basic error handling
      if (error.name === 'InvalidStateError') {
        returnStatus.message = 'Authenticator was probably already registered by user';
        returnStatus.success = false
        return returnStatus
      } else {
        console.error(getErrorMessage(error))
        returnStatus.message = "Failed on client side";
        returnStatus.success = false
        return returnStatus
      }
    } else {
      console.error(getErrorMessage(error))
      returnStatus.message = "Failed on client side (2)"
      returnStatus.success = false
      return returnStatus
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

      returnStatus.message = `Verification failed with status ${st} and body ${body}`
      returnStatus.message = "Failed"
      return returnStatus
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    returnStatus.message = "Error when calling registration endpoint: " + msg
    returnStatus.success = false
    return returnStatus
  }

  // Wait for the results of verification
  const verificationJSON = await verificationResp.json() as VerifiedRegistrationResponse;
  if (verificationJSON && verificationJSON.verified) {
    returnStatus.success = true
    returnStatus.message = ""
  } else {
    returnStatus.success = false
    returnStatus.message = "Error in verification with response body: " + JSON.stringify(verificationJSON ?? {})
  }
  return returnStatus
}