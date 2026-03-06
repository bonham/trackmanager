import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import type { Selectable } from 'kysely';
import { Kysely, PostgresDialect } from 'kysely';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { DB } from '../../../../types/db.js';
import type { Authenticator } from '../interfaces/server.js';

// This type describes the rows we pass into `authenticatorFromRows`.
//
// Start with Kysely's generated type for `public.cred_authenticators`, then:
// 1) Keep only the fields we actually select in our query (with `Pick`).
//
// We intentionally do not widen field types for tests.
// `counter` stays as the DB/Kysely type (BIGINT -> string in this project), and
// `credentialpublickey` stays as DB bytes from the driver.
//
// In short: runtime mapping follows DB contracts, and tests should match those contracts.
type CredentialAuthenticatorRow = Pick<
  Selectable<DB['public.cred_authenticators']>,
  | 'credentialid'
  | 'credentialpublickey'
  | 'counter'
  | 'credentialdevicetype'
  | 'credentialbackedup'
  | 'transports'
  | 'userid'
>;

const authenticatorTransportSchema = z.custom<AuthenticatorTransportFuture>(
  (value) => typeof value === 'string',
);
const authenticatorTransportsSchema = z.array(authenticatorTransportSchema);
const authenticatorCounterSchema = z
  .coerce
  .number()
  .int()
  .nonnegative()
  .refine(Number.isSafeInteger, 'Counter must be a safe integer');


export class AutenticatorDb {
  pgpool: Pool;
  db: Kysely<DB>;
  defaultAuthSchema: string;

  constructor(pgpool: Pool, authSchema = 'public') {
    this.pgpool = pgpool;
    this.defaultAuthSchema = authSchema;
    this.db = new Kysely<DB>({
      dialect: new PostgresDialect({
        pool: this.pgpool,
      }),
    });
  }

  private table(name: 'cred_authenticators' | 'registration_keys', authSchema?: string): keyof DB {
    const schema = authSchema ?? this.defaultAuthSchema;
    return `${schema}.${name}` as keyof DB;
  }

  static authenticatorFromRows(rows: CredentialAuthenticatorRow[]): Authenticator[] {
    const authenticators: Authenticator[] = rows.map((row) => {
      const transportsArray = authenticatorTransportsSchema.parse(JSON.parse(row.transports));
      const counterNum = authenticatorCounterSchema.parse(row.counter);

      const authenticator = {

        credentialID: row.credentialid,
        credentialPublicKey: new Uint8Array(row.credentialpublickey),
        counter: counterNum,
        credentialDeviceType: row.credentialdevicetype,
        credentialBackedUp: row.credentialbackedup,
        transports: transportsArray,
        userid: row.userid,
      };
      return authenticator;
    });
    return authenticators;
  }

  async getUserAuthenticators(user: string, authSchema?: string) {
    const rows = await this.db
      .selectFrom(this.table('cred_authenticators', authSchema))
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

  async getAuthenticatorsById(authenticatorId: string, authSchema?: string) {
    try {
      const rows = await this.db
        .selectFrom(this.table('cred_authenticators', authSchema))
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

  async saveAuthenticator(auth: Authenticator, userid: string, authSchema?: string) {
    const transportsEncoded = JSON.stringify(auth.transports);
    try {
      const r = await this.db
        .insertInto(this.table('cred_authenticators', authSchema))
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

  async getUserByRegistrationCode(regcode: string, authSchema?: string) {
    try {
      const row = await this.db
        .selectFrom(this.table('registration_keys', authSchema))
        .select(['regkey', 'username', 'created', 'used'])
        .where('regkey', '=', regcode)
        .executeTakeFirst();

      if (row === undefined) {
        console.error('Expected one row but got none');
        return null;
      }

      const created = row.created instanceof Date ? row.created : new Date(row.created);

      return {
        regkey: row.regkey,
        username: row.username,
        created,
        used: row.used,
      };
    } catch (error) {
      console.error('Could not get registration key details', error);
      return null;
    }
  }

  async markRegistrationCodeUsed(regcode: string, authSchema?: string): Promise<boolean> {
    try {
      const r = await this.db
        .updateTable(this.table('registration_keys', authSchema))
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
