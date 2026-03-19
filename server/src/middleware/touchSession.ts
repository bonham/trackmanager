import type { NextFunction, Request, Response } from 'express';

/**
 * Middleware to refresh session expiry on user actions.
 * Call req.session.touch() to update the session cookie maxAge,
 * effectively extending the session lifetime for active users.
 *
 * Application: routes that represent user activity (read/write operations)
 * Exclusion: heartbeat/status check routes (GET /session) should NOT use this
 */
function touchSessionMiddleware(req: Request, res: Response, next: NextFunction) {
  req.session.touch();
  next();
}

export { touchSessionMiddleware };

