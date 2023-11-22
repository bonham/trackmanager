/* eslint-disable @typescript-eslint/no-unused-vars */
import { readFileSync } from 'node:fs';
import { Pool } from 'pg';
import { processFitFile } from '../../src/lib/processFitFile';

jest.mock('pg');
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mClient) };
});

describe('FitFile', () => {
  let mockPool: any;
  beforeEach(() => {
    mockPool = new Pool();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('processFitFile', async () => {
    const buf = readFileSync('tests/data/Activity.fit');
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ nextval: 77 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await processFitFile(buf, 'myfilename.fit', 'mydbname', 'myschema');
  });
});
