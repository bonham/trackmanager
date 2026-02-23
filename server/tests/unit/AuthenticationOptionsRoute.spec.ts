import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@simplewebauthn/server', () => ({
  generateAuthenticationOptions: vi.fn(),
}));

import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { makeAuthenticationOptionsRoute } from '../../src/routes/auth/lib/AuthenticationOptionsRoute.js';
import type { AutenticatorDb } from '../../src/routes/auth/lib/AuthenticatorDb.js';

const mockGenerateAuthOptions = vi.mocked(generateAuthenticationOptions);

const mockAuthDb = {
  getUserAuthenticators: vi.fn(),
  getAuthenticatorsById: vi.fn(),
  saveAuthenticator: vi.fn(),
  getUserByRegistrationCode: vi.fn(),
  markRegistrationCodeUsed: vi.fn(),
} as unknown as AutenticatorDb;

function createTestApp(sessionData: Record<string, unknown> = {}) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next) => {
    Object.assign(req, {
      session: {
        ...sessionData,
        // Allow session properties to be set
      },
    });
    next();
  });
  app.use(makeAuthenticationOptionsRoute(mockAuthDb, 'localhost'));
  return app;
}

describe('AuthenticationOptionsRoute', () => {
  test('GET /authoptions returns authentication options when successful', async () => {
    const fakeOptions = {
      challenge: 'fake-challenge-123',
      allowCredentials: [],
      timeout: 60000,
      rpId: 'localhost',
    };
    mockGenerateAuthOptions.mockResolvedValue(fakeOptions as unknown as Awaited<ReturnType<typeof generateAuthenticationOptions>>);

    const app = createTestApp({});
    const res = await request(app).get('/authoptions');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ challenge: 'fake-challenge-123' });
  });

  test('GET /authoptions returns 500 when generateAuthenticationOptions throws', async () => {
    mockGenerateAuthOptions.mockRejectedValue(new Error('auth options error'));

    const app = createTestApp({});
    const res = await request(app).get('/authoptions');
    expect(res.status).toBe(500);
  });
});
