import { Kysely } from 'kysely';
import type { DB } from '../../types/db.js';

export async function up(db: Kysely<DB>): Promise<void> {
  await db.schema
    .createTable('auth.user_schema_permissions')
    .ifNotExists()
    .addColumn('userid', 'varchar', (col) => col.notNull())
    .addColumn('schema', 'varchar(30)', (col) => col.notNull())
    .addPrimaryKeyConstraint('user_schema_permissions_pk', ['userid', 'schema'])
    .execute();
}

export async function down(db: Kysely<DB>): Promise<void> {
  await db.schema.dropTable('auth.user_schema_permissions').ifExists().execute();
}
