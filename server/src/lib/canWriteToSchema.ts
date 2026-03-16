import type { NextFunction, Request, Response } from 'express';
import { Kysely } from 'kysely';
import * as z from 'zod';
import type { DB } from '../../types/db.js';

const ReqValidate = z.object({
  schema: z.string(),
  session: z.object({ user: z.string() }),
});

function createCanWriteToSchema(db: Kysely<DB>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = ReqValidate.safeParse(req);
    if (!parsed.success) {
      res.sendStatus(403);
      return;
    }
    const { schema, session: { user: userid } } = parsed.data;

    try {
      const row = await db
        .selectFrom('auth.user_schema_permissions')
        .select('userid')
        .where('userid', '=', userid)
        .where('schema', '=', schema)
        .executeTakeFirst();

      if (row === undefined) {
        res.sendStatus(403);
        return;
      }
      next();
    } catch (err) {
      console.error('canWriteToSchema error', err);
      res.sendStatus(500);
    }
  };
}

export default createCanWriteToSchema;
