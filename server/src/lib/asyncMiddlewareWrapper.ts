import type { NextFunction, Request, RequestHandler, Response } from "express";

const asyncWrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

export { asyncWrapper };

