import * as dotenv from 'dotenv';
import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import pg from 'pg';
import { makeAuthenticationOptionsRoute } from './lib/AuthenticationOptionsRoute.js';
import { makeAuthenticationRoute } from './lib/AuthenticationRoute.js';
import { AutenticatorDb } from './lib/AuthenticatorDb.js';
import { makeLogoutRoute } from './lib/LogoutRoute.js';
import { makeRegisterRoute } from './lib/RegisterRoute.js';
import { makeRegistrationOptionsRoute } from './lib/RegistrationOptionsRoute.js';

import type { RequestWebauthn } from './server.js';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.error('Missing configuration: Please copy .env.sample to .env and modify config');
  process.exit(1);
}

if (process.env.WEBAUTHN_RPNAME === undefined) throw Error();
if (process.env.WEBAUTHN_RPID === undefined) throw Error();
if (process.env.WEBAUTHN_ORIGIN === undefined) throw Error();
if (process.env.WEBAUTHN_ORIGIN === undefined) throw Error();

if (process.env.PASSKEYPOC_PGHOST === undefined) throw Error();
if (process.env.PASSKEYPOC_PGPORT === undefined) throw Error();
if (process.env.PASSKEYPOC_PGUSER === undefined) throw Error();
if (process.env.PASSKEYPOC_PGPASSWORD === undefined) throw Error();
if (process.env.PASSKEYPOC_PGDATABASE === undefined) throw Error();

// Human-readable title for your website
const rpName = process.env.WEBAUTHN_RPNAME;
// A unique identifier for your website
const rpID = process.env.WEBAUTHN_RPID;
// The URL at which registrations and authentications should occur
const origin = process.env.WEBAUTHN_ORIGIN;

const pgpool = new pg.Pool({
  host: process.env.PASSKEYPOC_PGHOST,
  port: Number(process.env.PASSKEYPOC_PGPORT),
  user: process.env.PASSKEYPOC_PGUSER,
  password: process.env.PASSKEYPOC_PGPASSWORD,
  database: process.env.PASSKEYPOC_PGDATABASE,
});

const authdb = new AutenticatorDb(pgpool);

const router = express.Router();

// Route: /register
const registerRoute = makeRegisterRoute(origin, rpID, authdb);
router.use(registerRoute);

// Route: /regoptions/regkey/:regkey
// Route: /regoptions/username/:nickname
const registrationOptionsRoute = makeRegistrationOptionsRoute(rpName, rpID, authdb);
router.use(registrationOptionsRoute);

// Route: /authoptions
const authentiationOptionsRoute = makeAuthenticationOptionsRoute(authdb);
router.use(authentiationOptionsRoute);

// Route: /authentication
const authenticationRoute = makeAuthenticationRoute(origin, rpID, authdb);
router.use(authenticationRoute);

// Route: /logout
const logoutRoute = makeLogoutRoute();
router.use(logoutRoute);

// middleware to test if authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if ('user' in req.session) next();
  else res.sendStatus(401);
}

router.get('/check', (req: RequestWebauthn, res) => {
  const { user } = req.session;
  if (user === undefined) {
    res.send('Not logged on');
  } else {
    res.send(`Logged on. User: ${user}`);
  }
});

router.get('/protected', isAuthenticated, (req, res) => {
  res.send('ok');
});

// not protected
router.get('/user', (req: RequestWebauthn, res) => {
  const userid = req.session.user
  res.json({ userid });
});

export default router;
export { isAuthenticated };

