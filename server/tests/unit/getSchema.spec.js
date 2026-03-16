import { describe, expect, test, vi } from 'vitest';
import getSchema from '../../src/lib/getSchema.ts';

function makeKyselyMock(resolvedValue) {
  const executeTakeFirst = vi.fn().mockResolvedValue(resolvedValue);
  const where = vi.fn().mockReturnValue({ executeTakeFirst });
  const select = vi.fn().mockReturnValue({ where });
  const selectFrom = vi.fn().mockReturnValue({ select });
  return { selectFrom };
}

function makeKyselyMockThrowing(error) {
  const executeTakeFirst = vi.fn().mockRejectedValue(error);
  const where = vi.fn().mockReturnValue({ executeTakeFirst });
  const select = vi.fn().mockReturnValue({ where });
  const selectFrom = vi.fn().mockReturnValue({ select });
  return { selectFrom };
}

describe('getSchema', () => {
  test('happypath', async () => {
    const mockDb = makeKyselyMock({ schema: 'myschema' });

    const schema = await getSchema('mysid', mockDb);
    expect(schema).toEqual('myschema');
  });

  test('sql exception', async () => {
    const mockDb = makeKyselyMockThrowing('SQL Error');

    const r = await getSchema('mysid', mockDb);
    expect(r).toBe(null);
  });

  test('empty result', async () => {
    const mockDb = makeKyselyMock(undefined);

    const r = await getSchema('mysid', mockDb);
    expect(r).toBe(null);
  });
});
