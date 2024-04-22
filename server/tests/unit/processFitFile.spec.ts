import { jest, test } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { Track2DbWriter } from '../../src/lib/Track2DbWriter.js';
import { processFitFile } from '../../src/lib/processFitFile.js';

const mockWrite = jest.fn<() => Promise<number>>()
jest.spyOn(Track2DbWriter.prototype, 'write').mockImplementation(mockWrite)

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
