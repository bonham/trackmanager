import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import type { Pool } from 'pg';

const PGSession = connectPgSimple(session);

function getSession(pgPool: Pool) {
  const salt = process.env.PASSKEYPOC_COOKIESALT;

  if (salt === undefined) {
    throw new Error('no cookiesalt in env');
  }

  const s = session(
    {
      secret: salt,
      cookie: {
        maxAge: 60000,
        sameSite: 'strict',
      },
      resave: false,
      saveUninitialized: true,
      store: new PGSession({
        pool: pgPool,
        createTableIfMissing: true,
      }),
    },
  );
  return s;
}

export default getSession;
