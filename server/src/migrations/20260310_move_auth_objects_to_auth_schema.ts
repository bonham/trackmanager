import { Kysely, sql } from 'kysely';
import type { DB } from '../../types/db.js';

const SOURCE_SCHEMA = 'public';
const TARGET_SCHEMA = 'auth';

interface ExistsRow {
  exists: boolean;
}

async function tableExists(db: Kysely<DB>, schema: string, table: string): Promise<boolean> {
  const name = `${schema}.${table}`;
  const result = await sql<ExistsRow>`
    SELECT to_regclass(${name}) IS NOT NULL AS "exists"
  `.execute(db);
  return result.rows[0]?.exists === true;
}

async function ensureAuthTable(db: Kysely<DB>, table: 'cred_authenticators' | 'registration_keys' | 'session'): Promise<void> {
  if (table === 'cred_authenticators') {
    await db.schema
      .createTable(`${TARGET_SCHEMA}.cred_authenticators`)
      .ifNotExists()
      .addColumn('credentialid', 'varchar', (col) => col.primaryKey().notNull())
      .addColumn('credentialpublickey', 'bytea', (col) => col.notNull())
      .addColumn('counter', 'bigint', (col) => col.notNull())
      .addColumn('credentialdevicetype', 'varchar(32)', (col) => col.notNull())
      .addColumn('credentialbackedup', 'boolean', (col) => col.notNull())
      .addColumn('transports', 'varchar(255)', (col) => col.notNull())
      .addColumn('userid', 'varchar', (col) => col.notNull())
      .addColumn('creationdate', sql`timestamp with time zone`, (col) => col.notNull())
      .execute();
    return;
  }

  if (table === 'registration_keys') {
    await db.schema
      .createTable(`${TARGET_SCHEMA}.registration_keys`)
      .ifNotExists()
      .addColumn('regkey', 'varchar', (col) =>
        col.primaryKey().notNull().defaultTo(sql`gen_random_uuid()`)
      )
      .addColumn('username', 'varchar', (col) => col.notNull())
      .addColumn('created', sql`timestamp with time zone`, (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn('used', 'boolean', (col) => col.notNull().defaultTo(false))
      .execute();
    return;
  }

  await db.schema
    .createTable(`${TARGET_SCHEMA}.session`)
    .ifNotExists()
    .addColumn('sid', 'varchar', (col) => col.primaryKey().notNull())
    .addColumn('sess', 'json', (col) => col.notNull())
    .addColumn('expire', sql`timestamp(6) without time zone`, (col) => col.notNull())
    .execute();
}

async function reconcileTable(
  db: Kysely<DB>,
  table: 'cred_authenticators' | 'registration_keys' | 'session',
): Promise<void> {
  const sourceExists = await tableExists(db, SOURCE_SCHEMA, table);
  const targetExists = await tableExists(db, TARGET_SCHEMA, table);

  if (sourceExists && !targetExists) {
    await sql`
      ALTER TABLE ${sql.ref(`${SOURCE_SCHEMA}.${table}`)} SET SCHEMA ${sql.ref(TARGET_SCHEMA)}
    `.execute(db);
    return;
  }

  if (!sourceExists && !targetExists) {
    await ensureAuthTable(db, table);
    return;
  }

  if (sourceExists && targetExists) {
    if (table === 'cred_authenticators') {
      await sql`
        INSERT INTO ${sql.ref(`${TARGET_SCHEMA}.cred_authenticators`)}
          (credentialid, credentialpublickey, counter, credentialdevicetype, credentialbackedup, transports, userid, creationdate)
        SELECT
          credentialid, credentialpublickey, counter, credentialdevicetype, credentialbackedup, transports, userid, creationdate
        FROM ${sql.ref(`${SOURCE_SCHEMA}.cred_authenticators`)}
        ON CONFLICT (credentialid) DO NOTHING
      `.execute(db);
      return;
    }

    if (table === 'registration_keys') {
      await sql`
        INSERT INTO ${sql.ref(`${TARGET_SCHEMA}.registration_keys`)}
          (regkey, username, created, used)
        SELECT regkey, username, created, used
        FROM ${sql.ref(`${SOURCE_SCHEMA}.registration_keys`)}
        ON CONFLICT (regkey) DO NOTHING
      `.execute(db);
      return;
    }

    await sql`
      INSERT INTO ${sql.ref(`${TARGET_SCHEMA}.session`)}
        (sid, sess, expire)
      SELECT sid, sess, expire
      FROM ${sql.ref(`${SOURCE_SCHEMA}.session`)}
      ON CONFLICT (sid) DO NOTHING
    `.execute(db);
  }
}

async function ensureSessionExpireIndex(db: Kysely<DB>): Promise<void> {
  await sql`
    CREATE INDEX IF NOT EXISTS ${sql.ref('IDX_session_expire')}
    ON ${sql.ref(`${TARGET_SCHEMA}.session`)} (expire)
  `.execute(db);
}

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS ${sql.ref(TARGET_SCHEMA)}`.execute(db);

  await reconcileTable(db, 'cred_authenticators');
  await reconcileTable(db, 'registration_keys');
  await reconcileTable(db, 'session');

  await ensureSessionExpireIndex(db);
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS ${sql.ref(SOURCE_SCHEMA)}`.execute(db);

  await sql`ALTER TABLE IF EXISTS ${sql.ref(`${TARGET_SCHEMA}.cred_authenticators`)} SET SCHEMA ${sql.ref(SOURCE_SCHEMA)}`.execute(db);
  await sql`ALTER TABLE IF EXISTS ${sql.ref(`${TARGET_SCHEMA}.registration_keys`)} SET SCHEMA ${sql.ref(SOURCE_SCHEMA)}`.execute(db);
  await sql`ALTER TABLE IF EXISTS ${sql.ref(`${TARGET_SCHEMA}.session`)} SET SCHEMA ${sql.ref(SOURCE_SCHEMA)}`.execute(db);

  await sql`DROP SCHEMA IF EXISTS ${sql.ref(TARGET_SCHEMA)}`.execute(db);
}
