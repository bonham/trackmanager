import { describe, expect, test, vi } from 'vitest';
import getSchema from '../../src/lib/getSchema.ts';

describe('getSchema', () => {
  test('happypath', async () => {
    const mockQuery = vi.fn();
    mockQuery.mockResolvedValue({ rows: [{ schema: 'myschema' }] });
    const mockPool = { query: mockQuery };

    const schema = await getSchema('mysid', mockPool);
    expect(schema).toEqual('myschema');
  });

  test('sql exception', async () => {
    const mockQuery = vi.fn();
    mockQuery.mockRejectedValue('SQL Error');
    const mockPool = { query: mockQuery };

    const r = await getSchema('mysid', mockPool);
    expect(r).toBe(null);
  });
  test('empty result', async () => {
    const mockQuery = vi.fn();
    mockQuery.mockResolvedValue({ rows: [] });
    const mockPool = { query: mockQuery };

    const r = await getSchema('mysid', mockPool);
    expect(r).toBe(null);
  });
});
