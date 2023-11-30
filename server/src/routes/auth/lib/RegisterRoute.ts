import type { RequestHandler } from 'express';
import { Router } from 'express';

import type { VerifiedRegistrationResponse } from '@simplewebauthn/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture, RegistrationResponseJSON } from '@simplewebauthn/typescript-types';
import type { MySession } from '../authInterfaces.js';
import type { Authenticator } from '../server.js';

import { AutenticatorDb } from './AuthenticatorDb.js';

const router = Router();

export function makeRegisterRoute(origin: string, rpID: string, authdb: AutenticatorDb) {
  router.post('/register', (async (req, res) => {
    let myreq: any;

    if ('session' in req) {
      myreq = req as (typeof req & MySession);
    } else {
      console.error('Request does not contain session');
      res.sendStatus(500);
      return;
    }

    const expectedChallenge = myreq.session.challenge;
    myreq.session.challenge = undefined;

    if (expectedChallenge === undefined) {
      console.log('Current user challenge is undefined');
      res.sendStatus(401);
      return;
    }
    const registrationuser = myreq.session.reguser;
    if (registrationuser === undefined) {
      console.log('Current user is undefined');
      res.sendStatus(401);
      return;
    }
    const body: RegistrationResponseJSON = await req.body;
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
    const { regkey } = (req.session as any);
    if (regkey !== undefined) {
      const markSuccess = authdb.markRegistrationCodeUsed(regkey);
      if (!(await markSuccess)) {
        console.log(`Could not mark regkey ${regkey} as used`);
        res.sendStatus(401);
        return;
      }
      (req.session as any).regkey = undefined;
    }

    // Success !!
    res.json(verification);
  }) as RequestHandler);
  return router;
}
