import { Kysely, PostgresDialect } from 'kysely';
import type { DB } from '../../types/db.js';
import getPgPool from './getPgPool.js';

/**
 * Creates and returns a Kysely database instance using the existing pg pool configuration
 */
export default function getKyselyDb(): Kysely<DB> {
  const pool = getPgPool();

  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool,
    }),
  });

  return db;
}
