/**
 * Script to run Kysely migrations
 * Run manually with: npm run create-auth-schema
 * or: npx tsx src/bin/createAuthSchema.ts
 */

import * as dotenv from 'dotenv';
import { Kysely, type MigrationProvider, Migrator, PostgresDialect } from 'kysely';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { DB } from '../../types/db.js';
import { EsmFileMigrationProvider } from '../lib/EsmFileMigrationProvider.js';
import getPgPool from '../lib/getPgPool.js';

// Load environment variables
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  console.error('Missing configuration: Please copy .env.sample to .env and modify config');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateToLatest() {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: getPgPool(),
    }),
  });

  const migrationFolder = path.resolve(__dirname, '../migrations');

  const migrator = new Migrator({
    db,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    provider: new EsmFileMigrationProvider({
      migrationFolder,
    }) as MigrationProvider,
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`✓ Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`✗ Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error('❌ Failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

// Run the script
migrateToLatest()
  .then(() => {
    console.log('\n✅ Migration complete. Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
