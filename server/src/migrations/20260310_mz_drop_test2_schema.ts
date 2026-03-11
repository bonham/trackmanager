import { Kysely, sql } from 'kysely';
import type { DB } from '../../types/db.js';

const SCHEMA = 'test2';

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`DROP SCHEMA IF EXISTS ${sql.ref(SCHEMA)} CASCADE`.execute(db);
}

export async function down(db: Kysely<DB>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS ${sql.ref(SCHEMA)}`.execute(db);
}
