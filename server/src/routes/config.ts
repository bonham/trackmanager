import * as dotenv from 'dotenv';
import type { Request, Response } from 'express';
import express from 'express';
import pg from 'pg';
import { asyncWrapper } from '../lib/asyncMiddlewareWrapper.js';
import createSidValidationChain from '../lib/sidResolverMiddleware.js';

const { Pool } = pg;


dotenv.config();

const router = express.Router();
router.use(express.json()); // use builtin json body parser


const database = process.env.TM_DATABASE;

// sql query pool
const poolOptions = {
  user: 'postgres',
  host: 'localhost',
  database,
};
const pool = new Pool(poolOptions);


async function configExists(schema: string): Promise<boolean> {
  const sql = `SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = $1
    AND tablename = 'config'
  ) as exists`
  const qresult = await pool.query<{ exists: boolean }>(sql, [schema])
  const exists = qresult.rows[0].exists
  console.log("XXX", typeof exists)
  return exists
}

const sidValidationChain = createSidValidationChain(pool);

router.get(
  '/get/sid/:sid/:conftype/:confkey',
  sidValidationChain,
  asyncWrapper(async (req: Request, res: Response) => {

    interface ResponseJson { value: (string | undefined) }

    const schema = req.schema
    const { conftype, confkey } = req.params

    if (schema === undefined) {
      throw Error("Schema is undefined")
    }
    if (conftype === undefined) {
      throw Error("conftype is undefined")
    }
    if (confkey === undefined) {
      throw Error("confkey is undefined")
    }

    if (!await configExists(schema)) {
      res.json({ value: undefined })
      return
    }

    const sql = 'select value '
      + `from ${schema}.config where conftype = $1 and key = $2`
    const queryResult = await pool.query<ResponseJson>(
      sql,
      [conftype, confkey]
    );

    if (queryResult.rowCount === null || queryResult.rowCount > 1) {
      throw Error(`Rowcount issue: ${queryResult.rowCount}`)
    } else if (queryResult.rowCount === 0) {
      res.json({ value: undefined })
      return
    } else {
      const { rows } = queryResult
      const row: ResponseJson = rows[0]
      res.json(row);
      return
    }
  })
);



export default router;
