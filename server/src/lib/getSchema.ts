import { Kysely } from "kysely";
import type { DB } from "../../types/db.js";
import { AUTH_SCHEMA } from "./serverConfig.js";

async function getSchema(sid: string, db: Kysely<DB>): Promise<string | null> {
  try {
    const row = await db
      .selectFrom(`${AUTH_SCHEMA}.schema_sid` as "auth.schema_sid")
      .select("schema")
      .where("sid", "=", sid)
      .executeTakeFirst();

    if (row === undefined) {
      console.error(`Sid ${sid} not found in DB`);
      return null;
    }
    return row.schema;
  } catch (err) {
    console.error('Could not get schema from sid:', err);
    return null;
  }
}
export default getSchema;
