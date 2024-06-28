import type { RequestHandler } from 'express';
import { Router } from 'express';

import type { VerifiedRegistrationResponse } from '@simplewebauthn/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture, RegistrationResponseJSON } from '@simplewebauthn/types';
import type { Authenticator, RequestWebauthn } from '../server.js';

import { AutenticatorDb } from './AuthenticatorDb.js';

const router = Router();

function isRegistrationResponse(obj: unknown): obj is RegistrationResponseJSON {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const keys = Object.keys(obj);
  return (
    "id" in obj &&
    "rawId" in obj &&
    "response" in obj &&
    "clientExtensionResults" in obj &&
    "type" in obj &&
    keys.length === 5
  );
}

export function makeRegisterRoute(origin: string, rpID: string, authdb: AutenticatorDb) {
  router.post('/register', (async (req: RequestWebauthn, res) => {

    if ('session' in req) {
      // ok
    } else {
      console.error('Request does not contain session');
      res.sendStatus(500);
      return;
    }

    const expectedChallenge = req.session.challenge;
    req.session.challenge = undefined;

    if (expectedChallenge === undefined) {
      console.log('Current user challenge is undefined');
      res.sendStatus(401);
      return;
    }
    const registrationuser = req.session.reguser;
    if (registrationuser === undefined) {
      console.log('Current user is undefined');
      res.sendStatus(401);
      return;
    }
    const body: unknown = await req.body;
    if (!isRegistrationResponse(body)) {
      console.log("Body was not registration response")
      res.sendStatus(401)
      return
    }
    const transports: AuthenticatorTransportFuture[] = body.response.transports ?? [];

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        // for passkeys:
        requireUserVerification: true,
      });
    } catch (error) {
      console.error(error);
      let message: string;
      if (error instanceof Error) {
        message = `${error.name} / ${error.message}`;
      } else {
        message = String(error);
      }
      res.status(401).send({ error: message });
      return;
    }

    if (!verification.verified) {
      console.error('Unexpected: Verification not verified, but no exception thrown before');
      res.sendStatus(401);
      return;
    }

    const { registrationInfo } = verification;
    if (registrationInfo === undefined) {
      console.log('registrationInfo is undefined');
      res.sendStatus(401);
      return;
    }

    const {
      credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp,
    } = registrationInfo;
    const newAuthenticator: Authenticator = {
      credentialPublicKey,
      credentialID,
      counter,
      credentialDeviceType,
      credentialBackedUp,
      transports,
    };

    const saveSuccess = await authdb.saveAuthenticator(newAuthenticator, registrationuser);
    if (!saveSuccess) {
      console.log('Authenticator could not be saved');
      res.sendStatus(401);
      return;
    }

    // mark registration key used
    const { regkey } = req.session;
    if (regkey !== undefined) {
      const markSuccess = authdb.markRegistrationCodeUsed(regkey);
      if (!(await markSuccess)) {
        console.log(`Could not mark regkey ${regkey} as used`);
        res.sendStatus(401);
        return;
      }
      req.session.regkey = undefined;
    }

    // Success !!
    res.json(verification);
  }) as RequestHandler);
  return router;
}
