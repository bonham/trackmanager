import { Kysely, sql } from 'kysely';
import type { DB } from '../../types/db.js';

// Configuration: Schema name for authentication tables
const SCHEMA = 'test2';

export async function up(db: Kysely<DB>): Promise<void> {
  // Create schema if it doesn't exist
  await sql`CREATE SCHEMA IF NOT EXISTS ${sql.ref(SCHEMA)}`.execute(db);

  // Create cred_authenticators table
  await db.schema
    .createTable(`${SCHEMA}.cred_authenticators`)
    .addColumn('credentialid', 'varchar', (col) => col.primaryKey().notNull())
    .addColumn('credentialpublickey', 'bytea', (col) => col.notNull())
    .addColumn('counter', 'bigint', (col) => col.notNull())
    .addColumn('credentialdevicetype', 'varchar(32)', (col) => col.notNull())
    .addColumn('credentialbackedup', 'boolean', (col) => col.notNull())
    .addColumn('transports', 'varchar(255)', (col) => col.notNull())
    .addColumn('userid', 'varchar', (col) => col.notNull())
    .addColumn('creationdate', sql`timestamp with time zone`, (col) => col.notNull())
    .execute();

  // Create registration_keys table
  await db.schema
    .createTable(`${SCHEMA}.registration_keys`)
    .addColumn('regkey', 'varchar', (col) =>
      col.primaryKey().notNull().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('username', 'varchar', (col) => col.notNull())
    .addColumn('created', sql`timestamp with time zone`, (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('used', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute();

  // Create session table
  await db.schema
    .createTable(`${SCHEMA}.session`)
    .addColumn('sid', 'varchar', (col) => col.primaryKey().notNull())
    .addColumn('sess', 'json', (col) => col.notNull())
    .addColumn('expire', sql`timestamp(6) without time zone`, (col) => col.notNull())
    .execute();

  // Create index on session.expire
  await db.schema
    .createIndex('IDX_session_expire')
    .on(`${SCHEMA}.session`)
    .column('expire')
    .execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
  // Drop index first
  await db.schema.dropIndex('IDX_session_expire').ifExists().execute();

  // Drop tables in reverse order
  await db.schema.dropTable(`${SCHEMA}.session`).ifExists().execute();
  await db.schema.dropTable(`${SCHEMA}.registration_keys`).ifExists().execute();
  await db.schema.dropTable(`${SCHEMA}.cred_authenticators`).ifExists().execute();

  // Drop schema (only if empty)
  await sql`DROP SCHEMA IF EXISTS ${sql.ref(SCHEMA)} CASCADE`.execute(db);
}
