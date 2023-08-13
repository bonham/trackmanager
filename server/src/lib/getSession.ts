import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import type { Pool } from 'pg';

const PGSession = connectPgSimple(session);

function getSession(pgPool: Pool) {
  const salt = process.env.PASSKEYPOC_COOKIESALT;
  const maxAge = Number(process.env.SESSION_MAX_AGE) || 60000;

  if (salt === undefined) {
    throw new Error('no cookiesalt in env');
  }

  // secure is false because we are using http behind proxy
  const s = session(
    {
      secret: salt,
      cookie: {
        maxAge,
        sameSite: 'strict',
        secure: false,
      },
      resave: false,
      saveUninitialized: true,
      store: new PGSession({
        pool: pgPool,
        createTableIfMissing: false,
      }),
    },
  );
  return s;
}

export default getSession;
