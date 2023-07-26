import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { Router } from 'express';
import type { Request } from 'express-serve-static-core';
import type { Authenticator } from '../server.js';
import { AutenticatorDb } from './AuthenticatorDb.js';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function makeAuthenticationOptionsRoute(authdb: AutenticatorDb) {
  // call this route with /authoptions?authuser=myuserid
  router.get('/authoptions', async (req: Request, res) => {
    // Seems to make no sense to query user authenticators and send to client
    // client should discover himself
    // const authuser = req.params.authuser;
    // const userAuthenticators: Authenticator[] = await authdb.getUserAuthenticators(authuser);
    const userAuthenticators: Authenticator[] = [];

    // we could deny sending authentication options at this point, in case no authenticators could
    // be found for given credential id?
    // if (userAuthenticators.length < 1) {
    //   console.log('No authenticators found in DB');
    //   res.status(401).send(`User ${authuser} is not registered on this server`);
    //   return;
    // }

    try {
      const options = generateAuthenticationOptions({
        // Require users to use a previously-registered authenticator
        allowCredentials: userAuthenticators.map((authenticator) => ({
          id: authenticator.credentialID,
          type: 'public-key',
          // Optional
          transports: authenticator.transports,
        })),
        userVerification: 'preferred',
      });

      (req.session as any).challenge = options.challenge;

      res.json(options);
    } catch (error) {
      console.error('Error in generating authentication options', error);
      res.sendStatus(500);
    }
  });
  return router;
}
