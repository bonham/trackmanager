import type { RequestHandler } from 'express';
import { Router } from 'express';


import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { AutenticatorDb } from './AuthenticatorDb.js';

const router = Router();

export function makeAuthenticationRoute(origin: string, rpID: string, authdb: AutenticatorDb) {
  router.post('/authentication', (async (req, res) => {
    const { body } = req;

    const expectedChallenge = (req.session as any).challenge;
    (req.session as any).challenge = undefined;

    // (Pseudocode} Retrieve an authenticator from the DB that
    // should match the `id` in the returned credential
    console.log('Body id:', body.id);
    const authenticators = await authdb.getAuthenticatorsById(body.id);

    if (authenticators.length !== 1) {
      console.error(`Expected 1 authenticator, got ${authenticators.length}, for credential id ${body.id}`);
      res.sendStatus(401);
      return;
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator: authenticators[0],
        // for passkeys:
        requireUserVerification: true,
      });
    } catch (error) {
      console.error('Auth verification failed', error);
      res.status(401).send({ error: (error as any).message });
    }
    // success
    (req.session as any).user = authenticators[0].userid;
    console.log('Verification', verification);
    res.json(verification);
  }) as RequestHandler);
  return router;
}
