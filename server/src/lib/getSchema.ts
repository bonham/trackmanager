import type { Pool } from "pg";
async function getSchema(sid: string, pool: Pool): Promise<string | null> {
  const sql = `select schema from tm_meta.schema_sid where sid = '${sid}'`;
  let queryResult;
  try {
    queryResult = await pool.query(sql);
  } catch (err) {
    console.error('Could not get schema from sid:', err);
    return null;
  }
  const { rows } = queryResult;
  if (rows.length !== 1) {
    console.error(`Sid ${sid} not found in DB`);
    return null;
  }
  return rows[0].schema;
}
export default getSchema;
