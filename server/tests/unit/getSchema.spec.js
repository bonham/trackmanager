const getSchema = require('../../src/lib/getSchema');

describe('getSchema', () => {
  test('happypath', async () => {
    const mockQuery = jest.fn();
    mockQuery.mockResolvedValue({ rows: [{ schema: 'myschema' }] });
    const mockPool = { query: mockQuery };

    const schema = await getSchema('mysid', mockPool);
    expect(schema).toEqual('myschema');
  });

  test('sql exception', async () => {
    const mockQuery = jest.fn();
    mockQuery.mockRejectedValue('SQL Error');
    const mockPool = { query: mockQuery };

    const r = await getSchema('mysid', mockPool);
    expect(r).toBe(null);
  });
  test('empty result', async () => {
    const mockQuery = jest.fn();
    mockQuery.mockResolvedValue({ rows: [] });
    const mockPool = { query: mockQuery };

    const r = await getSchema('mysid', mockPool);
    expect(r).toBe(null);
  });
});
