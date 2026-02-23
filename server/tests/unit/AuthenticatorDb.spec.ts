import type { Pool, QueryResult } from 'pg';
import { describe, expect, test, vi } from 'vitest';
import { AutenticatorDb } from '../../src/routes/auth/lib/AuthenticatorDb.js';

function makeMockPool(queryResult: Partial<QueryResult> = {}): Pool {
  const defaultResult: QueryResult = {
    rows: [],
    rowCount: 0,
    command: 'SELECT',
    oid: 0,
    fields: [],
  };
  return {
    query: vi.fn().mockResolvedValue({ ...defaultResult, ...queryResult }),
    connect: vi.fn(),
    end: vi.fn(),
  } as unknown as Pool;
}

const sampleRow = {
  credentialid: 'cred-id-123',
  credentialpublickey: new Uint8Array([1, 2, 3]),
  credentialdevicetype: 'singleDevice',
  credentialbackedup: false,
  counter: 5,
  transports: '["usb","nfc"]',
  userid: 'user-abc',
};

describe('AutenticatorDb.authenticatorFromRows', () => {
  test('converts rows to Authenticator objects', () => {
    const result = AutenticatorDb.authenticatorFromRows([sampleRow]);
    expect(result).toHaveLength(1);
    const auth = result[0];
    expect(auth.credentialID).toBe('cred-id-123');
    expect(auth.counter).toBe(5);
    expect(auth.credentialDeviceType).toBe('singleDevice');
    expect(auth.credentialBackedUp).toBe(false);
    expect(auth.transports).toEqual(['usb', 'nfc']);
    expect(auth.userid).toBe('user-abc');
  });

  test('returns empty array for empty input', () => {
    expect(AutenticatorDb.authenticatorFromRows([])).toEqual([]);
  });
});

describe('AutenticatorDb.getUserAuthenticators', () => {
  test('returns authenticators for valid rows', async () => {
    const pool = makeMockPool({ rows: [sampleRow] });
    const db = new AutenticatorDb(pool);

    const result = await db.getUserAuthenticators('user-abc');
    expect(result).toHaveLength(1);
    expect(result[0].credentialID).toBe('cred-id-123');
  });

  test('returns empty array when no rows', async () => {
    const pool = makeMockPool({ rows: [] });
    const db = new AutenticatorDb(pool);

    const result = await db.getUserAuthenticators('unknown');
    expect(result).toEqual([]);
  });

  test('throws when rows have unexpected shape', async () => {
    const pool = makeMockPool({ rows: [{ unexpected: 'field' }] });
    const db = new AutenticatorDb(pool);

    await expect(db.getUserAuthenticators('user')).rejects.toThrow();
  });
});

describe('AutenticatorDb.getAuthenticatorsById', () => {
  test('returns authenticator for valid credential id', async () => {
    const pool = makeMockPool({ rows: [sampleRow] });
    const db = new AutenticatorDb(pool);

    const result = await db.getAuthenticatorsById('cred-id-123');
    expect(result).toHaveLength(1);
    expect(result[0].credentialID).toBe('cred-id-123');
  });

  test('throws with helpful message on missing table (42P01)', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(Object.assign(new Error('table not found'), { code: '42P01' })),
    } as unknown as Pool;
    const db = new AutenticatorDb(pool);

    await expect(db.getAuthenticatorsById('any')).rejects.toThrow(
      'Looks like the database schema for sessions is missing',
    );
  });

  test('rethrows other errors', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('network error')),
    } as unknown as Pool;
    const db = new AutenticatorDb(pool);

    await expect(db.getAuthenticatorsById('any')).rejects.toThrow('network error');
  });
});

describe('AutenticatorDb.saveAuthenticator', () => {
  const auth = {
    credentialID: 'cred-id-123' as import('@simplewebauthn/server').Base64URLString,
    credentialPublicKey: new Uint8Array([1, 2, 3]) as Uint8Array<ArrayBuffer>,
    counter: 1,
    credentialDeviceType: 'singleDevice' as 'singleDevice' | 'multiDevice',
    credentialBackedUp: false,
    transports: ['usb' as import('@simplewebauthn/server').AuthenticatorTransportFuture],
    userid: 'user1',
  };

  test('returns true on successful save (rowCount=1)', async () => {
    const pool = makeMockPool({ rowCount: 1 });
    const db = new AutenticatorDb(pool);

    const result = await db.saveAuthenticator(auth, 'user1');
    expect(result).toBe(true);
  });

  test('returns false when rowCount is not 1', async () => {
    const pool = makeMockPool({ rowCount: 0 });
    const db = new AutenticatorDb(pool);

    const result = await db.saveAuthenticator(auth, 'user1');
    expect(result).toBe(false);
  });

  test('returns false on query error', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('db error')),
    } as unknown as Pool;
    const db = new AutenticatorDb(pool);

    const result = await db.saveAuthenticator(auth, 'user1');
    expect(result).toBe(false);
  });
});

describe('AutenticatorDb.getUserByRegistrationCode', () => {
  const regRow = {
    regkey: 'abc123',
    username: 'testuser',
    created: new Date('2024-01-01'),
    used: false,
  };

  test('returns registration code lookup on success', async () => {
    const pool = makeMockPool({ rows: [regRow], rowCount: 1 });
    const db = new AutenticatorDb(pool);

    const result = await db.getUserByRegistrationCode('abc123');
    expect(result).toEqual(regRow);
  });

  test('returns null when not found (rows.length !== 1)', async () => {
    const pool = makeMockPool({ rows: [], rowCount: 0 });
    const db = new AutenticatorDb(pool);

    const result = await db.getUserByRegistrationCode('notfound');
    expect(result).toBeNull();
  });

  test('returns null on query error', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('db error')),
    } as unknown as Pool;
    const db = new AutenticatorDb(pool);

    const result = await db.getUserByRegistrationCode('any');
    expect(result).toBeNull();
  });
});

describe('AutenticatorDb.markRegistrationCodeUsed', () => {
  test('returns true when rowCount is 1', async () => {
    const pool = makeMockPool({ rowCount: 1 });
    const db = new AutenticatorDb(pool);

    const result = await db.markRegistrationCodeUsed('abc123');
    expect(result).toBe(true);
  });

  test('returns false when rowCount is not 1', async () => {
    const pool = makeMockPool({ rowCount: 0 });
    const db = new AutenticatorDb(pool);

    const result = await db.markRegistrationCodeUsed('notfound');
    expect(result).toBe(false);
  });

  test('returns false on query error', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('db error')),
    } as unknown as Pool;
    const db = new AutenticatorDb(pool);

    const result = await db.markRegistrationCodeUsed('any');
    expect(result).toBe(false);
  });
});

describe('isRowType (tested indirectly via getUserAuthenticators)', () => {
  const missingFieldCases = [
    ['null value', null],
    ['non-object', 'string'],
    ['missing credentialid', { credentialpublickey: new Uint8Array(), credentialdevicetype: '', credentialbackedup: false, counter: 0, transports: '[]', userid: '' }],
    ['missing credentialpublickey', { credentialid: 'x', credentialdevicetype: '', credentialbackedup: false, counter: 0, transports: '[]', userid: '' }],
    ['missing counter', { credentialid: 'x', credentialpublickey: new Uint8Array(), credentialdevicetype: '', credentialbackedup: false, transports: '[]', userid: '' }],
    ['missing transports', { credentialid: 'x', credentialpublickey: new Uint8Array(), credentialdevicetype: '', credentialbackedup: false, counter: 0, userid: '' }],
    ['missing userid', { credentialid: 'x', credentialpublickey: new Uint8Array(), credentialdevicetype: '', credentialbackedup: false, counter: 0, transports: '[]' }],
  ];

  missingFieldCases.forEach(([name, badRow]) => {
    test(`getUserAuthenticators throws for row with ${name as string}`, async () => {
      const pool = makeMockPool({ rows: [badRow] });
      const db = new AutenticatorDb(pool);
      await expect(db.getUserAuthenticators('user')).rejects.toThrow();
    });
  });
});
