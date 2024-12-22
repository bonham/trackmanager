import type { RequestHandler } from 'express';
import { Router } from 'express';
import type { RequestWebauthn } from '../interfaces/server.js';


import type { AuthenticationResponseJSON, VerifiedAuthenticationResponse, WebAuthnCredential } from '@simplewebauthn/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { AutenticatorDb } from './AuthenticatorDb.js';

const router = Router();



export function makeAuthenticationRoute(origin: string, rpID: string, authdb: AutenticatorDb) {
  router.post('/authentication', (async (req: RequestWebauthn, res, next) => {
    try {
      let body: AuthenticationResponseJSON
      if (isAuthResponseJSON(req.body)) {
        body = req.body
      } else {
        console.error("No req in body")
        throw Error("Internal Error")
      }

      const expectedChallenge = req.session.challenge;
      if (expectedChallenge === undefined) {
        console.error("Did not receive challenge")
        res.sendStatus(401)
        return
      }
      req.session.challenge = undefined;

      // (Pseudocode} Retrieve an authenticator from the DB that
      // should match the `id` in the returned credential
      console.log('Body id:', body.id);
      const authenticators = await authdb.getAuthenticatorsById(body.id);

      if (authenticators.length !== 1) {
        console.error(`Expected 1 authenticator, got ${authenticators.length}, for credential id ${body.id}`);
        res.sendStatus(401);
        return;
      }

      const aut = authenticators[0]
      const credential: WebAuthnCredential = {

        id: aut.credentialID,
        publicKey: aut.credentialPublicKey,
        counter: aut.counter,
        transports: aut.transports
      }

      let verification: VerifiedAuthenticationResponse;
      try {
        verification = await verifyAuthenticationResponse({
          response: body,
          expectedChallenge,
          expectedOrigin: origin,
          expectedRPID: rpID,
          credential,
          // for passkeys:
          requireUserVerification: true,
        });
      } catch (error) {
        console.error('Auth verification failed', error);
        let msg = ""
        if (error instanceof Error) {
          msg = error.message
        } else if (typeof error === 'string') {
          msg = error
        }
        res.status(401).send({ error: msg });
        return
      }
      // success
      req.session.user = authenticators[0].userid;
      console.log('Verification', verification);
      res.json(verification);
    } catch (error) {
      next(error)
    }
  }) as RequestHandler);
  return router;
}

function isAuthResponseJSON(r: unknown): r is AuthenticationResponseJSON {
  if (
    r !== null &&
    typeof (r) === 'object' &&
    'id' in r &&
    'rawId' in r &&
    'response' in r &&
    'clientExtensionResults' in r &&
    'type' in r
  ) {
    return true
  } else {
    return false
  }
} 
