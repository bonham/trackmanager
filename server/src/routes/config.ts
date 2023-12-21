import * as dotenv from 'dotenv';
import type { Request, Response } from 'express';
import express from 'express';
import pkg from 'pg';
import { asyncWrapper } from '../lib/asyncMiddlewareWrapper.js';
import createSidValidationChain from '../lib/sidResolverMiddleware.js';

const { Pool } = pkg;


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
const sidValidationChain = createSidValidationChain(pool);

router.get(
  '/get/sid/:sid/:conftype/:confkey',
  sidValidationChain,
  asyncWrapper(async (req: Request, res: Response) => {
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


    const sql = 'select value '
      + `from ${schema}.config where conftype = $1 and key = $2`
    const queryResult = await pool.query<{ 'value': string }>(
      sql,
      [conftype, confkey]
    );

    if (queryResult.rowCount !== 1) {
      throw Error(`Rowcount is ${queryResult.rowCount} but should be 1`)
    }
    const { rows } = queryResult
    const row = rows[0]
    res.json(row);
  })
);



export default router;
