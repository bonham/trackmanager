import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
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
  if (obj === null) { console.log("row is null"); return false }
  if (typeof obj !== 'object') { console.log("row is not object"); return false }
  if (!('credentialid' in obj)) { console.log("credentialid missing"); return false }
  if (!('credentialpublickey' in obj)) { console.log("credentialpublickey missing"); return false }
  if (!('credentialdevicetype' in obj)) { console.log("credentialdevicetype missing"); return false }
  if (!('credentialbackedup' in obj)) { console.log("credentialbackedup missing"); return false }
  if (!('counter' in obj)) { console.log("counter missing"); return false }
  if (!('transports' in obj)) { console.log("transports missing"); return false }
  if (!('userid' in obj)) { console.log("userid missing"); return false }
  return true
}

function isRowTypeArray(obj: unknown): obj is RowType[] {
  if (obj === null) { console.log("row is null"); return false }
  if (!Array.isArray(obj)) { console.log("obj not array"); return false }

  const allObjectsAreRows = obj.every((el) => {
    return isRowType(el)
  })
  return allObjectsAreRows

}


export class AutenticatorDb {
  pgpool: Pool;
  db: Kysely<DB>;

  constructor(pgpool: Pool) {
    this.pgpool = pgpool;
    this.db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: this.pgpool,
      }),
    });
  }

  private table(name: 'cred_authenticators' | 'registration_keys'): keyof DB {
    return `public.${name}` as keyof DB;
  }

  static authenticatorFromRows(rows: RowType[]): Authenticator[] {
    const authenticators: Authenticator[] = rows.map((row) => {
      const transportsArray = JSON.parse(row.transports) as AuthenticatorTransportFuture[]; // unsafe

      const authenticator = {

        credentialID: row.credentialid,
        credentialPublicKey: row.credentialpublickey as Uint8Array<ArrayBuffer>,
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
    const rows = await this.db
      .selectFrom(this.table('cred_authenticators'))
      .select([
        'credentialid',
        'credentialpublickey',
        'counter',
        'credentialdevicetype',
        'credentialbackedup',
        'transports',
        'userid',
      ])
      .where('userid', '=', user)
      .execute();
    return AutenticatorDb.authenticatorFromRows(rows);
  }

  async getAuthenticatorsById(authenticatorId: string) {
    try {
      const rows = await this.db
        .selectFrom(this.table('cred_authenticators'))
        .select([
          'credentialid',
          'credentialpublickey',
          'counter',
          'credentialdevicetype',
          'credentialbackedup',
          'transports',
          'userid',
        ])
        .where('credentialid', '=', authenticatorId)
        .execute();
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
    const transportsEncoded = JSON.stringify(auth.transports);

    const query: QueryConfig = {
      text: 'INSERT INTO public.cred_authenticators'
        + '(credentialid, credentialpublickey, counter, credentialdevicetype, credentialbackedup, transports, userid, creationdate) '
        + 'VALUES ($1, $2, $3, $4, $5, $6, $7, $8);',
      values: [
        auth.credentialID, auth.credentialPublicKey, auth.counter, auth.credentialDeviceType,
        auth.credentialBackedUp, transportsEncoded, userid, new Date().toUTCString(),
      ],
    };
    try {
      const r = await this.db
        .insertInto(this.table('cred_authenticators'))
        .values({
          credentialid: auth.credentialID,
          credentialpublickey: Buffer.from(auth.credentialPublicKey),
          counter: String(auth.counter),
          credentialdevicetype: auth.credentialDeviceType,
          credentialbackedup: auth.credentialBackedUp,
          transports: transportsEncoded,
          userid,
          creationdate: new Date(),
        })
        .executeTakeFirst();

      if (Number(r.numInsertedOrUpdatedRows) !== 1) {
        console.error(`Expected rowcount is not 1 but ${r.numInsertedOrUpdatedRows}`);
        return false;
      }
    } catch (error) {
      console.error('Could not save authenticator', error);
      return false;
    }
    return true;
  }

  async getUserByRegistrationCode(regcode: string) {
    try {
      const row = await this.db
        .selectFrom(this.table('registration_keys'))
        .select(['regkey', 'username', 'created', 'used'])
        .where('regkey', '=', regcode)
        .executeTakeFirst();

      if (row === undefined) {
        console.error('Expected one row but got none');
        return null;
      }
      return r.rows[0] as RegCodeLookup;
    } catch (error) {
      console.error('Could not get registration key details', error);
      return null;
    }
  }

  async markRegistrationCodeUsed(regcode: string): Promise<boolean> {
    try {
      const r = await this.db
        .updateTable(this.table('registration_keys'))
        .set({ used: true })
        .where('regkey', '=', regcode)
        .executeTakeFirst();

      if (Number(r.numUpdatedRows) !== 1) {
        console.error(`Expected rowcount is not 1 but ${r.numUpdatedRows}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('DB error when updating DB', error);
      return false;
    }
  }
}
