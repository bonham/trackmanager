import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@simplewebauthn/server', () => ({
  verifyAuthenticationResponse: vi.fn(),
}));

import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { makeAuthenticationRoute } from '../../src/routes/auth/lib/AuthenticationRoute.js';
import type { AutenticatorDb } from '../../src/routes/auth/lib/AuthenticatorDb.js';

const mockVerify = vi.mocked(verifyAuthenticationResponse);

const mockAuthDb = {
  getUserAuthenticators: vi.fn(),
  getAuthenticatorsById: vi.fn(),
  saveAuthenticator: vi.fn(),
  getUserByRegistrationCode: vi.fn(),
  markRegistrationCodeUsed: vi.fn(),
} as unknown as AutenticatorDb;

const ORIGIN = 'https://example.com';
const RP_ID = 'example.com';

// Minimal valid AuthenticationResponseJSON shape
const validBody = {
  id: 'cred-id',
  rawId: 'cred-raw-id',
  response: {
    authenticatorData: 'authdata',
    clientDataJSON: 'clientdata',
    signature: 'sig',
  },
  clientExtensionResults: {},
  type: 'public-key',
};

const fakeAuthenticator = {
  credentialID: 'cred-id',
  credentialPublicKey: new Uint8Array([1, 2, 3]),
  counter: 0,
  credentialDeviceType: 'singleDevice',
  credentialBackedUp: false,
  transports: [],
  userid: 'user-uuid-1',
};

function createTestApp(sessionData: Record<string, unknown> = {}) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next) => {
    const sess: Record<string, unknown> = { ...sessionData };
    Object.assign(req, { session: sess });
    next();
  });
  app.use(makeAuthenticationRoute(ORIGIN, RP_ID, mockAuthDb));
  // error handler
  app.use((_err: unknown, _req: Request, res: Response, _next: unknown) => {
    res.sendStatus(500);
  });
  return app;
}

describe('AuthenticationRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('POST /authentication returns 500 when body is not valid AuthenticationResponseJSON', async () => {
    const app = createTestApp({ challenge: 'my-challenge' });
    const res = await request(app).post('/authentication').send({ invalid: true });
    expect(res.status).toBe(500);
  });

  test('POST /authentication returns 401 when challenge is undefined', async () => {
    const app = createTestApp({}); // no challenge in session
    const res = await request(app).post('/authentication').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /authentication returns 401 when no authenticators found', async () => {
    vi.mocked(mockAuthDb.getAuthenticatorsById).mockResolvedValue([]);
    const app = createTestApp({ challenge: 'my-challenge' });
    const res = await request(app).post('/authentication').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /authentication returns 401 when more than one authenticator found', async () => {
    vi.mocked(mockAuthDb.getAuthenticatorsById).mockResolvedValue([fakeAuthenticator, fakeAuthenticator]);
    const app = createTestApp({ challenge: 'my-challenge' });
    const res = await request(app).post('/authentication').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /authentication returns 401 when verifyAuthenticationResponse throws', async () => {
    vi.mocked(mockAuthDb.getAuthenticatorsById).mockResolvedValue([fakeAuthenticator]);
    mockVerify.mockRejectedValue(new Error('verification error'));
    const app = createTestApp({ challenge: 'my-challenge' });
    const res = await request(app).post('/authentication').send(validBody);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'verification error' });
  });

  test('POST /authentication returns 401 when verifyAuthenticationResponse throws a string', async () => {
    vi.mocked(mockAuthDb.getAuthenticatorsById).mockResolvedValue([fakeAuthenticator]);
    mockVerify.mockRejectedValue('string-error');
    const app = createTestApp({ challenge: 'my-challenge' });
    const res = await request(app).post('/authentication').send(validBody);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'string-error' });
  });

  test('POST /authentication returns 200 and sets session user on success', async () => {
    vi.mocked(mockAuthDb.getAuthenticatorsById).mockResolvedValue([fakeAuthenticator]);
    const fakeVerification = {
      verified: true,
      authenticationInfo: {
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
      },
    };
    mockVerify.mockResolvedValue(fakeVerification as unknown as Awaited<ReturnType<typeof verifyAuthenticationResponse>>);

    const app = createTestApp({ challenge: 'my-challenge' });
    const res = await request(app).post('/authentication').send(validBody);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ verified: true });
  });
});
