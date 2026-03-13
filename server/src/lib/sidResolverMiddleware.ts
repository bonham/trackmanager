import type { NextFunction, Request, Response } from "express";
import { Kysely } from 'kysely';
import type { DB } from '../../types/db.js';

import * as expressvalidator from 'express-validator';
import getSchema from './getSchema.js';
const { param, validationResult } = expressvalidator

const handleErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Sid validation failed', errors.array());
    return res.status(401).end();
  }
  next();
  return undefined;
};

function createSidValidationChain(db: Kysely<DB>) {
  return [
    param('sid')
      .exists()
      .withMessage('Sid does not exist')
      .isAlphanumeric()
      .withMessage('Sid is not alphanum')
      .bail()
      .custom(async (value: string, { req }) => {
        const sid = value;
        const schema = await getSchema(sid, db);
        if (schema === null) {
          throw new Error('Could not resolve schema');
        } else {
          req.schema = schema;
        }
      }),
    handleErrors,
  ];
}

export default createSidValidationChain;
