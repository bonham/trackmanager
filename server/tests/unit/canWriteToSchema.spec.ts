import type { NextFunction, Request, Response } from 'express';
import { Kysely } from 'kysely';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { DB } from '../../src/../types/db.js';
import createCanWriteToSchema from '../../src/lib/canWriteToSchema.js';

/**
 * Creates a mock implementation of a Kysely database instance for testing purposes.
 * 
 * This mock simulates a chain of method calls (`selectFrom`, `select`, `where`, etc.)
 * commonly used in Kysely queries, ultimately resolving to the provided result when
 * `executeTakeFirst` is called. This allows for controlled testing of database access
 * logic without requiring a real database connection.
 *
 * @param result - The mock result to be returned by `executeTakeFirst`, simulating a database row or undefined.
 * @returns A mock Kysely<DB> instance with stubbed query methods.
 */
function makeMockDb(result: { userid: string } | undefined): Kysely<DB> {
  const executeTakeFirst = vi.fn().mockResolvedValue(result);
  const where2 = { executeTakeFirst };
  const where1 = { where: vi.fn(() => where2) };
  const select = { where: vi.fn(() => where1) };
  const selectFrom = { select: vi.fn(() => select) };
  return { selectFrom: vi.fn(() => selectFrom) } as unknown as Kysely<DB>;
}

function makeReq(userid: string | undefined, schema: string | undefined): Request {
  return {
    session: { user: userid },
    schema,
  } as unknown as Request;
}

function makeRes() {
  return { sendStatus: vi.fn() } as unknown as Response;
}

describe('canWriteToSchema', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  test('calls next() when user has permission for schema', async () => {
    const db = makeMockDb({ userid: 'alice' });
    const middleware = createCanWriteToSchema(db);
    const res = makeRes();

    await middleware(makeReq('alice', 'myschema'), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.sendStatus).not.toHaveBeenCalled();
  });

  test('sends 403 when user has no entry in permissions table', async () => {
    const db = makeMockDb(undefined);
    const middleware = createCanWriteToSchema(db);
    const res = makeRes();

    await middleware(makeReq('alice', 'myschema'), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('sends 403 when userid is missing from session', async () => {
    const db = makeMockDb({ userid: 'alice' });
    const middleware = createCanWriteToSchema(db);
    const res = makeRes();

    await middleware(makeReq(undefined, 'myschema'), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('sends 403 when schema is missing from request', async () => {
    const db = makeMockDb({ userid: 'alice' });
    const middleware = createCanWriteToSchema(db);
    const res = makeRes();

    await middleware(makeReq('alice', undefined), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('sends 500 when db query throws', async () => {
    const executeTakeFirst = vi.fn().mockRejectedValue(new Error('db failure'));
    const where2 = { executeTakeFirst };
    const where1 = { where: vi.fn(() => where2) };
    const select = { where: vi.fn(() => where1) };
    const selectFrom = { select: vi.fn(() => select) };
    const db = { selectFrom: vi.fn(() => selectFrom) } as unknown as Kysely<DB>;
    const middleware = createCanWriteToSchema(db);
    const res = makeRes();

    await middleware(makeReq('alice', 'myschema'), res, next);

    expect(res.sendStatus).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});
