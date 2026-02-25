import type { Pool, QueryResult } from "pg";
import * as z from "zod";

const SchemaSidRowSchema = z.object({
  schema: z.string()
});


async function getSchema(sid: string, pool: Pool): Promise<string | null> {
  const sql = `select schema from tm_meta.schema_sid where sid = '${sid}'`;
  let queryResult: QueryResult;
  try {
    queryResult = await pool.query(sql);
  } catch (err) {
    console.error('Could not get schema from sid:', err);
    return null;
  }
  const rows = z.array(SchemaSidRowSchema).parse(queryResult.rows);

  if (rows.length !== 1) {
    console.error(`Sid ${sid} not found in DB`);
    return null;
  }
  return rows[0].schema;
}
export default getSchema;
