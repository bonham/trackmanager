import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@simplewebauthn/server', () => ({
  verifyRegistrationResponse: vi.fn(),
}));

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type { AutenticatorDb } from '../../src/routes/auth/lib/AuthenticatorDb.js';
import { makeRegisterRoute } from '../../src/routes/auth/lib/RegisterRoute.js';

const mockVerify = vi.mocked(verifyRegistrationResponse);

const mockAuthDb = {
  getUserAuthenticators: vi.fn(),
  getAuthenticatorsById: vi.fn(),
  saveAuthenticator: vi.fn(),
  getUserByRegistrationCode: vi.fn(),
  markRegistrationCodeUsed: vi.fn(),
} as unknown as AutenticatorDb;

const ORIGIN = 'https://example.com';
const RP_ID = 'example.com';

// Minimal valid RegistrationResponseJSON shape
const validBody = {
  id: 'cred-id',
  rawId: 'cred-raw-id',
  response: {
    attestationObject: 'attest',
    clientDataJSON: 'clientdata',
  },
  clientExtensionResults: {},
  type: 'public-key',
};

function createTestApp(sessionData: Record<string, unknown> = {}) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next) => {
    const sess: Record<string, unknown> = { ...sessionData };
    Object.assign(req, { session: sess });
    next();
  });
  app.use(makeRegisterRoute(ORIGIN, RP_ID, mockAuthDb));
  return app;
}

describe('RegisterRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('POST /register returns 401 when challenge is missing from session', async () => {
    const app = createTestApp({ reguser: 'user1' }); // no challenge
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /register returns 401 when reguser is missing from session', async () => {
    const app = createTestApp({ challenge: 'my-challenge' }); // no reguser
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /register returns 401 when body is not a valid registration response', async () => {
    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1' });
    const res = await request(app).post('/register').send({ invalid: true });
    expect(res.status).toBe(401);
  });

  test('POST /register returns 401 with error message when verifyRegistrationResponse throws', async () => {
    mockVerify.mockRejectedValue(new Error('Verification failed!'));
    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: expect.stringContaining('Verification failed!') });
  });

  test('POST /register returns 401 when verification.verified is false', async () => {
    mockVerify.mockResolvedValue({
      verified: false,
    } as unknown as Awaited<ReturnType<typeof verifyRegistrationResponse>>);
    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /register returns 401 when registrationInfo is undefined', async () => {
    mockVerify.mockResolvedValue({
      verified: true,
      registrationInfo: undefined,
    } as unknown as Awaited<ReturnType<typeof verifyRegistrationResponse>>);
    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /register returns 401 when saveAuthenticator fails', async () => {
    mockVerify.mockResolvedValue({
      verified: true,
      registrationInfo: {
        credential: {
          publicKey: new Uint8Array([1, 2, 3]),
          id: 'cred-id',
          counter: 0,
          transports: [],
        },
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
      },
    } as unknown as Awaited<ReturnType<typeof verifyRegistrationResponse>>);
    vi.mocked(mockAuthDb.saveAuthenticator).mockResolvedValue(false);

    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
  });

  test('POST /register returns 200 json when successful (no regkey)', async () => {
    const fakeVerification = {
      verified: true,
      registrationInfo: {
        credential: {
          publicKey: new Uint8Array([1, 2, 3]),
          id: 'cred-id',
          counter: 0,
          transports: [],
        },
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
      },
    };
    mockVerify.mockResolvedValue(fakeVerification as unknown as Awaited<ReturnType<typeof verifyRegistrationResponse>>);
    vi.mocked(mockAuthDb.saveAuthenticator).mockResolvedValue(true);

    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(200);
  });

  test('POST /register marks regkey used when regkey present in session', async () => {
    const fakeVerification = {
      verified: true,
      registrationInfo: {
        credential: {
          publicKey: new Uint8Array([1, 2, 3]),
          id: 'cred-id',
          counter: 0,
          transports: [],
        },
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
      },
    };
    mockVerify.mockResolvedValue(fakeVerification as unknown as Awaited<ReturnType<typeof verifyRegistrationResponse>>);
    vi.mocked(mockAuthDb.saveAuthenticator).mockResolvedValue(true);
    vi.mocked(mockAuthDb.markRegistrationCodeUsed).mockResolvedValue(true);

    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1', regkey: 'some-regkey' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(200);
    expect(mockAuthDb.markRegistrationCodeUsed).toHaveBeenCalledWith('some-regkey');
  });

  test('POST /register returns 401 when markRegistrationCodeUsed fails', async () => {
    const fakeVerification = {
      verified: true,
      registrationInfo: {
        credential: {
          publicKey: new Uint8Array([1, 2, 3]),
          id: 'cred-id',
          counter: 0,
          transports: [],
        },
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
      },
    };
    mockVerify.mockResolvedValue(fakeVerification as unknown as Awaited<ReturnType<typeof verifyRegistrationResponse>>);
    vi.mocked(mockAuthDb.saveAuthenticator).mockResolvedValue(true);
    vi.mocked(mockAuthDb.markRegistrationCodeUsed).mockResolvedValue(false);

    const app = createTestApp({ challenge: 'my-challenge', reguser: 'user1', regkey: 'some-regkey' });
    const res = await request(app).post('/register').send(validBody);
    expect(res.status).toBe(401);
  });
});
