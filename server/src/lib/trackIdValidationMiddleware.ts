import type { NextFunction, Request, Response } from 'express';
import * as expressvalidator from 'express-validator';
const { param, validationResult } = expressvalidator

export default [
  param('trackId').exists().isInt(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).end();
    }
    next();
    return undefined;
  },
];
