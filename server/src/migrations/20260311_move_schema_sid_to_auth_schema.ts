import { Kysely, sql } from 'kysely';
import type { DB } from '../../types/db.js';

interface ExistsRow {
  exists: boolean;
}

async function tableExists(db: Kysely<DB>, qualifiedName: string): Promise<boolean> {
  const result = await sql<ExistsRow>`
    SELECT to_regclass(${qualifiedName}) IS NOT NULL AS "exists"
  `.execute(db);
  return result.rows[0]?.exists === true;
}

export async function up(db: Kysely<DB>): Promise<void> {
  await sql`CREATE SCHEMA IF NOT EXISTS ${sql.ref('auth')}`.execute(db);

  await db.schema
    .createTable('auth.schema_sid')
    .ifNotExists()
    .addColumn('sid', 'varchar(10)', (col) => col.notNull())
    .addColumn('schema', 'varchar(30)', (col) => col.notNull())
    .addPrimaryKeyConstraint('schema_sid_pk', ['sid', 'schema'])
    .execute();

  const sourceExists = await tableExists(db, 'tm_meta.schema_sid');
  if (sourceExists) {
    await sql`
      INSERT INTO ${sql.ref('auth.schema_sid')} (sid, schema)
      SELECT sid, schema
      FROM ${sql.ref('tm_meta.schema_sid')}
      ON CONFLICT (sid, schema) DO NOTHING
    `.execute(db);
  }

  await sql`DROP SCHEMA IF EXISTS ${sql.ref('tm_meta')} CASCADE`.execute(db);
}

export async function down(db: Kysely<DB>): Promise<void> {
  await db.schema.dropTable('auth.schema_sid').ifExists().execute();
}
