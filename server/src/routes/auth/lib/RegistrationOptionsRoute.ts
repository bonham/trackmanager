import { Router } from 'express';
import type { Request, Response } from 'express-serve-static-core';

//import { getRegistrationUserId } from './getRegistrationUserid.js';
import { AutenticatorDb } from './AuthenticatorDb.js';

import type { Authenticator } from '../server.js';

import { generateRegistrationOptions } from '@simplewebauthn/server';

const MAX_REGCODE_AGE_MS = 1000 * 60 * 60 * 24; // 1 day
//const MAX_REGCODE_AGE_MS = 1000 * 60 * 5; // 5 minutes

const router = Router();


export function makeRegistrationOptionsRoute(rpName: string, rpID: string, authdb: AutenticatorDb) {

  const handleRegistration = async (req: Request, res: Response, reguser: string) => {


    //const registrationuser = await getRegistrationUserId();
    const registrationuser = reguser;
    (req.session as any).reguser = registrationuser;

    // (Pseudocode) Retrieve any of the user's previously-
    // registered authenticators
    const userAuthenticators: Authenticator[] = await authdb.getUserAuthenticators(registrationuser);

    try {
      const options = generateRegistrationOptions({
        rpName,
        rpID,
        userID: registrationuser,
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
        excludeCredentials: userAuthenticators.map(authenticator => ({
          id: authenticator.credentialID,
          type: 'public-key',
          // Optional
          transports: authenticator.transports,
        })),
      });

      // (Pseudocode) Remember the challenge for this user
      (req.session as any).challenge = options.challenge;
      res.json(options);

    } catch (error) {
      console.error('Error in generating authentication options', error);
      res.sendStatus(500);
      return;

    }
  };

  router.get('/regoptions/regkey/:regkey', async (req: Request, res) => {

    const lookup = await authdb.getUserByRegistrationCode(req.params.regkey);
    (req.session as any).regkey = req.params.regkey; // save to mark as unused later

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

      console.log(`Regkey too old: Age: ${age}`);
      res.sendStatus(401);
      return;
    }

    const reguser = lookup.username;
    await handleRegistration(req, res, reguser);
  });

  router.get('/regoptions/username/:nickname', (req, res) => {
    const reguser = req.params.nickname;
    handleRegistration(req, res, reguser);
  });

  return router;
}