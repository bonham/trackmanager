import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { processFitFile } from '../../src/lib/processFitFile.js';
import { Track2DbWriter } from '../../src/lib/Track2DbWriter.js';

vi.mock('../../src/lib/Track2DbWriter.js', () => {
  const Track2DbWriter = vi.fn(class MockTrack2DbWriter {
    init = vi.fn()
    write = vi.fn()
    end = vi.fn()
  })
  return { default: { Track2DbWriter }, Track2DbWriter }
})


//type DbOpts = Parameters<InstanceType<typeof Track2DbWriter>['init']>[0];

// const mockInit = vi.fn<[o: DbOpts], Promise<void>>();
// const mockWrite = vi.fn<[], Promise<number>>()
// vi.spyOn(Track2DbWriter.prototype, 'write').mockImplementation(mockWrite)
// vi.spyOn(Track2DbWriter.prototype, 'init').mockImplementation(mockInit)

describe('FitFile', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  })

  test('processFitFile', async () => {
    const buf = readFileSync('tests/data/Activity.fit');
    await processFitFile(buf, 'myfilename.fit', 'mydbname', 'myschema');
    expect(vi.mocked(Track2DbWriter).mock.instances[0].write).toHaveBeenCalled();
  });
});
