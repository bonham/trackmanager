import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';

vi.mock('pg', () => {
  const Pool = vi.fn(class FakePool {
    connect = vi.fn()
    query = vi.fn()
    end = vi.fn()
  })
  return { default: { Pool }, Pool }
})

// Mock connect-pg-simple to use a no-op session store
vi.mock('connect-pg-simple', () => {
  const { Store } = require('express-session');
  class MemorySessionStore extends Store {
    store: Record<string, unknown> = {};
    get(sid: string, cb: (err: Error | null, session?: unknown) => void) {
      cb(null, this.store[sid]);
    }
    set(sid: string, session: unknown, cb: (err?: Error) => void) {
      this.store[sid] = session;
      cb();
    }
    destroy(sid: string, cb: (err?: Error) => void) {
      delete this.store[sid];
      cb();
    }
  }
  return {
    default: () => MemorySessionStore,
  };
})

import authRouter, { isAuthenticated } from '../../src/routes/auth/auth.js';

/**
 * Creates a minimal test express app that mounts the auth router
 * and injects a controllable session object.
 */
function createTestApp(sessionData: Record<string, unknown> = {}) {
  const app = express();
  app.use(express.json());
  // Inject a mock session
  app.use((req: Request, _res: Response, next: NextFunction) => {
    Object.assign(req, {
      session: {
        ...sessionData,
        destroy: (cb: (err?: Error) => void) => cb(),
      },
    });
    next();
  });
  app.use(authRouter);
  return app;
}

describe('isAuthenticated middleware', () => {
  test('calls next() when user is in session', () => {
    const req = { session: { user: 'alice' } } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    isAuthenticated(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  test('sends 401 when user is not in session', () => {
    const req = { session: {} } as unknown as Request;
    const res = { sendStatus: vi.fn() } as unknown as Response;
    const next = vi.fn();

    isAuthenticated(req, res, next);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('GET /check', () => {
  test('returns "Not logged on" when no user in session', async () => {
    const app = createTestApp({});
    const res = await request(app).get('/check');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Not logged on');
  });

  test('returns "Logged on. User: ..." when user is in session', async () => {
    const app = createTestApp({ user: 'alice' });
    const res = await request(app).get('/check');
    expect(res.status).toBe(200);
    expect(res.text).toContain('alice');
    expect(res.text).toContain('Logged on');
  });
});

describe('GET /protected', () => {
  test('returns 200 "ok" when user is authenticated', async () => {
    const app = createTestApp({ user: 'alice' });
    const res = await request(app).get('/protected');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  test('returns 401 when user is not authenticated', async () => {
    const app = createTestApp({});
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });
});

describe('GET /user', () => {
  test('returns userid when user is in session', async () => {
    const app = createTestApp({ user: 'bob' });
    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userid: 'bob' });
  });

  test('returns undefined userid when user not in session', async () => {
    const app = createTestApp({});
    const res = await request(app).get('/user');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userid: undefined });
  });
});
