import { Router } from 'express';
import type { Response } from 'express-serve-static-core';
import { Duration } from 'luxon';
import { asyncWrapper } from '../../../lib/asyncMiddlewareWrapper.js';

import { generateRegistrationOptions } from '@simplewebauthn/server';
import { AutenticatorDb } from './AuthenticatorDb.js';

import type { Authenticator, RequestWebauthn } from '../interfaces/server.js';

const MAX_REGCODE_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
// const MAX_REGCODE_AGE_MS = 1000 * 60 * 5; // 5 minutes

const router = Router();

export function makeRegistrationOptionsRoute(rpName: string, rpID: string, authdb: AutenticatorDb) {
  const handleRegistration = async (req: RequestWebauthn, res: Response, reguser: string) => {
    // const registrationuser = getRegistrationUserId();
    const registrationuser = reguser;
    req.session.reguser = registrationuser;

    // (Pseudocode) Retrieve any of the user's previously-
    // registered authenticators
    const devices = await authdb.getUserAuthenticators(registrationuser);

    try {
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: registrationuser, // we do not want personal identifiable information

        // the following is for 'passkeys' usage
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred',
        },

        // Don't prompt users for additional information about the authenticator
        // (Recommended for smoother UX)
        attestationType: 'none',
        // Prevent users from re-registering existing authenticators
        excludeCredentials: devices.map((dev: Authenticator) => {
          return {
            id: dev.credentialID,
            type: 'public-key',
            // Optional
            transports: dev.transports,
          }
        }),
      });

      // (Pseudocode) Remember the challenge for this user
      req.session.challenge = options.challenge;
      res.json(options);
    } catch (error) {
      console.error('Error in generating authentication options', error);
      res.sendStatus(500);
    }
  };

  interface ReqWithParams extends RequestWebauthn {
    params: {
      regkey?: string
    }
  }

  router.get('/regoptions/regkey/:regkey', asyncWrapper(async (req: ReqWithParams, res) => {
    const regkey = req.params.regkey
    if (regkey === undefined) {
      console.error("regkey undefined")
      res.sendStatus(401)
      return
    }
    const lookup = await authdb.getUserByRegistrationCode(regkey);
    req.session.regkey = regkey; // save to mark as unused later

    if (lookup === null) {
      console.log('Regkey not found');
      res.sendStatus(401);
      return;
    }

    if (lookup.used) {
      console.log('Regkey was already used');
      res.sendStatus(401);
      return;
    }

    const createdMilisec = lookup.created.getTime();
    const nowMilisec = Date.now();
    const age = nowMilisec - createdMilisec;

    if (age > MAX_REGCODE_AGE_MS) {
      const ageObj = Duration.fromMillis(age)
      console.log(`Regkey too old: Age: ${ageObj.as('days')} days`);
      res.sendStatus(401);
      return;
    }

    const reguser = lookup.username;
    await handleRegistration(req, res, reguser);
  }));

  return router;
}
