import { describe, jest, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { processFitFile } from '../../src/lib/processFitFile.js';

import { Track2DbWriter } from '../../src/lib/Track2DbWriter.js';
jest.mock('../../src/lib/Track2DbWriter.js')

type DbOpts = Parameters<InstanceType<typeof Track2DbWriter>['init']>[0];

const mockInit = jest.fn<(o: DbOpts) => Promise<void>>();
const mockWrite = jest.fn<() => Promise<number>>()
jest.spyOn(Track2DbWriter.prototype, 'write').mockImplementation(mockWrite)
jest.spyOn(Track2DbWriter.prototype, 'init').mockImplementation(mockInit)

describe('FitFile', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  })

  test('processFitFile', async () => {
    mockWrite.mockResolvedValue(77)
    const buf = readFileSync('tests/data/Activity.fit');
    await processFitFile(buf, 'myfilename.fit', 'mydbname', 'myschema');
    expect(mockWrite).toHaveBeenCalledTimes(1)
  });
});
