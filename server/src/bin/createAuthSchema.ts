/**
 * Script to create authentication-related database tables using Kysely
 * Run manually with: npm run create-auth-schema
 * or: npx tsx src/bin/createAuthSchema.ts
 */

import * as dotenv from 'dotenv';
import { sql } from 'kysely';
import getKyselyDb from '../lib/getKyselyDb.js';

// Load environment variables
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.error('Missing configuration: Please copy .env.sample to .env and modify config');
  process.exit(1);
}

// Configuration: Schema name for authentication tables
const SCHEMA = 'testauthtabs';

async function createAuthSchema() {
  const db = getKyselyDb();

  try {
    console.log('Creating authentication schema tables...\n');

    // Create cred_authenticators table
    console.log(`Creating table: ${SCHEMA}.cred_authenticators`);
    await db.schema
      .createTable(`${SCHEMA}.cred_authenticators`)
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
    console.log(`✓ Table ${SCHEMA}.cred_authenticators created successfully\n`);

    // Create registration_keys table
    console.log(`Creating table: ${SCHEMA}.registration_keys`);
    await db.schema
      .createTable(`${SCHEMA}.registration_keys`)
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
    console.log(`✓ Table ${SCHEMA}.registration_keys created successfully\n`);

    // Create session table
    console.log(`Creating table: ${SCHEMA}.session`);
    await db.schema
      .createTable(`${SCHEMA}.session`)
      .ifNotExists()
      .addColumn('sid', 'varchar', (col) => col.primaryKey().notNull())
      .addColumn('sess', 'json', (col) => col.notNull())
      .addColumn('expire', sql`timestamp(6) without time zone`, (col) => col.notNull())
      .execute();
    console.log(`✓ Table ${SCHEMA}.session created successfully\n`);

    // Create index on session.expire
    console.log('Creating index: IDX_session_expire');
    await db.schema
      .createIndex('IDX_session_expire')
      .ifNotExists()
      .on(`${SCHEMA}.session`)
      .column('expire')
      .execute();
    console.log('✓ Index IDX_session_expire created successfully\n');

    console.log('✅ All authentication schema tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating authentication schema:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

// Run the script
createAuthSchema()
  .then(() => {
    console.log('\nSchema creation complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
