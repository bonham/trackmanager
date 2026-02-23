import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: vi.fn(),
}));

import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AutenticatorDb } from '../../src/routes/auth/lib/AuthenticatorDb.js';
import { makeRegistrationOptionsRoute } from '../../src/routes/auth/lib/RegistrationOptionsRoute.js';

const mockGenerateRegOptions = vi.mocked(generateRegistrationOptions);

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
    const sess: Record<string, unknown> = { ...sessionData };
    Object.assign(req, { session: sess });
    next();
  });
  app.use(makeRegistrationOptionsRoute('Test App', 'example.com', mockAuthDb));
  return app;
}

describe('RegistrationOptionsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('GET /regoptions/regkey/:regkey returns 401 when regkey not found', async () => {
    vi.mocked(mockAuthDb.getUserByRegistrationCode).mockResolvedValue(null);
    const app = createTestApp({});
    const res = await request(app).get('/regoptions/regkey/unknown-key');
    expect(res.status).toBe(401);
  });

  test('GET /regoptions/regkey/:regkey returns 401 when regkey already used', async () => {
    vi.mocked(mockAuthDb.getUserByRegistrationCode).mockResolvedValue({
      regkey: 'some-key',
      username: 'user1',
      created: new Date(),
      used: true,
    });
    const app = createTestApp({});
    const res = await request(app).get('/regoptions/regkey/some-key');
    expect(res.status).toBe(401);
  });

  test('GET /regoptions/regkey/:regkey returns 401 when regkey is too old', async () => {
    const eightDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8); // 8 days old
    vi.mocked(mockAuthDb.getUserByRegistrationCode).mockResolvedValue({
      regkey: 'old-key',
      username: 'user1',
      created: eightDaysAgo,
      used: false,
    });
    const app = createTestApp({});
    const res = await request(app).get('/regoptions/regkey/old-key');
    expect(res.status).toBe(401);
  });

  test('GET /regoptions/regkey/:regkey returns 200 with options when valid', async () => {
    const recentDate = new Date(Date.now() - 1000 * 60); // 1 minute ago
    vi.mocked(mockAuthDb.getUserByRegistrationCode).mockResolvedValue({
      regkey: 'valid-key',
      username: 'user1',
      created: recentDate,
      used: false,
    });
    vi.mocked(mockAuthDb.getUserAuthenticators).mockResolvedValue([]);
    const fakeOptions = {
      challenge: 'reg-challenge-123',
      rp: { name: 'Test App', id: 'example.com' },
      user: { id: 'user-id', name: 'user1', displayName: 'user1' },
      pubKeyCredParams: [],
      timeout: 60000,
      attestation: 'none',
      excludeCredentials: [],
      authenticatorSelection: {},
    };
    mockGenerateRegOptions.mockResolvedValue(fakeOptions as unknown as Awaited<ReturnType<typeof generateRegistrationOptions>>);

    const app = createTestApp({});
    const res = await request(app).get('/regoptions/regkey/valid-key');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ challenge: 'reg-challenge-123' });
  });

  test('GET /regoptions/regkey/:regkey returns 500 when generateRegistrationOptions throws', async () => {
    const recentDate = new Date(Date.now() - 1000 * 60);
    vi.mocked(mockAuthDb.getUserByRegistrationCode).mockResolvedValue({
      regkey: 'valid-key',
      username: 'user1',
      created: recentDate,
      used: false,
    });
    vi.mocked(mockAuthDb.getUserAuthenticators).mockResolvedValue([]);
    mockGenerateRegOptions.mockRejectedValue(new Error('options error'));

    const app = createTestApp({});
    const res = await request(app).get('/regoptions/regkey/valid-key');
    expect(res.status).toBe(500);
  });
});
