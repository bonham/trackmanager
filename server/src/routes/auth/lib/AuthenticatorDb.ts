import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import type { Pool, QueryConfig } from 'pg';
import type { Authenticator, RegCodeLookup } from '../interfaces/server.js';


interface RowType {
  credentialid: string;
  credentialpublickey: Uint8Array;
  credentialdevicetype: string;
  credentialbackedup: boolean;
  counter: number;
  transports: string;
  userid: string;
}

function isRowType(obj: unknown): obj is RowType {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'credentialid' in obj &&
    'credentialpublickey' in obj &&
    'credentialdevicetype' in obj &&
    'credentialbackedup' in obj &&
    'counter' in obj &&
    'transports' in obj &&
    'userid' in obj
  );
}


export class AutenticatorDb {
  pgpool: Pool;

  constructor(pgpool: Pool) {
    this.pgpool = pgpool;
  }

  static authenticatorFromRows(rows: RowType[]): Authenticator[] {
    const authenticators: Authenticator[] = rows.map((row) => {
      const credIDEncoded: string = row.credentialid;
      const credBuffer = Buffer.from(credIDEncoded, 'base64url');
      const transportsArray = JSON.parse(row.transports) as AuthenticatorTransportFuture[]; // unsafe

      const authenticator = {
        credentialID: credBuffer,
        credentialPublicKey: row.credentialpublickey,
        counter: row.counter,
        credentialDeviceType: row.credentialdevicetype,
        credentialBackedUp: row.credentialbackedup,
        transports: transportsArray,
        userid: row.userid,
      };
      return authenticator;
    });
    return authenticators;
  }

  async getUserAuthenticators(user: string) {
    const query: QueryConfig = {
      text: 'SELECT credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp, transports FROM public.cred_authenticators where userid = $1',
      values: [user],
    };
    const res = await this.pgpool.query(query);
    const rows = res.rows
    if (!isRowType(rows)) {
      throw new Error("rows does not have expected type")
    }
    return AutenticatorDb.authenticatorFromRows(rows);
  }

  async getAuthenticatorsById(authenticatorId: string) {
    const query: QueryConfig = {
      text: 'SELECT credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp, transports, userid FROM public.cred_authenticators where credentialID = $1',
      values: [authenticatorId],
    };
    try {
      const res = await this.pgpool.query(query);
      const rows = res.rows
      if (!isRowType(rows)) {
        throw new Error("rows does not have expected type")
      }
      return AutenticatorDb.authenticatorFromRows(rows);
    } catch (e: unknown) {
      if ((e instanceof Error) && ('code' in e) && (e.code === '42P01')) {
        throw new Error(
          'Looks like the database schema for sessions is missing',
          {
            cause: e,
          },
        );
      } else throw e;
    }
  }

  async saveAuthenticator(auth: Authenticator, userid: string) {
    const credIdBuf = Buffer.from(auth.credentialID);
    const credIdEncoded = credIdBuf.toString('base64url');
    const transportsEncoded = JSON.stringify(auth.transports);

    const query: QueryConfig = {
      text: 'INSERT INTO public.cred_authenticators'
        + '(credentialid, credentialpublickey, counter, credentialdevicetype, credentialbackedup, transports, userid, creationdate) '
        + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
      values: [
        credIdEncoded, auth.credentialPublicKey, auth.counter, auth.credentialDeviceType,
        auth.credentialBackedUp, transportsEncoded, userid, new Date().toUTCString(),
      ],
    };
    try {
      const r = await this.pgpool.query(query);
      if (r.rowCount !== 1) {
        console.error(`Expected rowcount is not 1 but ${r.rowCount}`);
        return false;
      }
    } catch (error) {
      console.error('Could not save authenticator', error);
      return false;
    }
    return true;
  }

  async getUserByRegistrationCode(regcode: string) {
    const query: QueryConfig = {
      text: 'SELECT regkey, username, created, used FROM public.registration_keys where regkey = $1',
      values: [regcode],
    };

    try {
      const r = await this.pgpool.query(query);
      if (r.rows.length !== 1) {
        console.error(`Expected rows length is not 1 but ${r.rows.length}`);
        return null;
      }
      return r.rows[0] as RegCodeLookup;
    } catch (error) {
      console.error('Could not get registration key details', error);
      return null;
    }
  }

  async markRegistrationCodeUsed(regcode: string): Promise<boolean> {
    const query: QueryConfig = {
      text: 'UPDATE public.registration_keys SET used=TRUE WHERE regkey = $1',
      values: [regcode],
    };

    try {
      const r = await this.pgpool.query(query);
      if (r.rowCount !== 1) {
        console.error(`Expected rowcount is not 1 but ${r.rowCount}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('DB error when updating DB', error);
      return false;
    }
  }
}
