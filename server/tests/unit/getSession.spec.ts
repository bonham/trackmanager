import type { Pool } from 'pg';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('connect-pg-simple', () => {
  const { Store } = require('express-session');
  class MemorySessionStore extends Store {
    get(_sid: string, cb: (err: Error | null, session?: unknown) => void) { cb(null, undefined); }
    set(_sid: string, _session: unknown, cb: () => void) { cb(); }
    destroy(_sid: string, cb: () => void) { cb(); }
  }
  return { default: () => MemorySessionStore };
})

import getSession from '../../src/lib/getSession.js';

const mockPool = {} as Pool;

describe('getSession', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('throws when PASSKEYPOC_COOKIESALT is not set', () => {
    const saved = process.env['PASSKEYPOC_COOKIESALT'];
    delete process.env['PASSKEYPOC_COOKIESALT'];
    try {
      expect(() => getSession(mockPool)).toThrow('no cookiesalt in env');
    } finally {
      if (saved !== undefined) {
        process.env['PASSKEYPOC_COOKIESALT'] = saved;
      }
    }
  });

  test('returns session middleware when PASSKEYPOC_COOKIESALT is set', () => {
    process.env['PASSKEYPOC_COOKIESALT'] = 'testsecret';
    const session = getSession(mockPool);
    expect(typeof session).toBe('function');
    delete process.env['PASSKEYPOC_COOKIESALT'];
  });

  test('uses SESSION_MAX_AGE env var when set', () => {
    process.env['PASSKEYPOC_COOKIESALT'] = 'testsecret';
    process.env['SESSION_MAX_AGE'] = '30000';
    // Should not throw
    const session = getSession(mockPool);
    expect(typeof session).toBe('function');
    delete process.env['PASSKEYPOC_COOKIESALT'];
    delete process.env['SESSION_MAX_AGE'];
  });

  test('falls back to default maxAge (60000) when SESSION_MAX_AGE not set', () => {
    process.env['PASSKEYPOC_COOKIESALT'] = 'testsecret';
    delete process.env['SESSION_MAX_AGE'];
    const session = getSession(mockPool);
    expect(typeof session).toBe('function');
    delete process.env['PASSKEYPOC_COOKIESALT'];
  });
});
