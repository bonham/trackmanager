import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';
import { makeLogoutRoute } from '../../src/routes/auth/lib/LogoutRoute.js';

function createTestApp(sessionDestroy: (cb: (err?: Error) => void) => void) {
  const app = express();
  app.use((req: Request, _res: Response, next) => {
    Object.assign(req, {
      session: {
        destroy: sessionDestroy,
      },
    });
    next();
  });
  app.use(makeLogoutRoute());
  return app;
}

describe('LogoutRoute', () => {
  test('returns 200 "OK" when session.destroy succeeds', async () => {
    const app = createTestApp((cb) => cb());
    const res = await request(app).get('/logout');
    expect(res.status).toBe(200);
    expect(res.text).toBe('OK');
  });

  test('returns 500 when session.destroy errors', async () => {
    const app = createTestApp((cb) => cb(new Error('destroy failed')));
    const res = await request(app).get('/logout');
    expect(res.status).toBe(500);
  });
});
