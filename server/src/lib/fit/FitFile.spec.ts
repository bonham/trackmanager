import { readFileSync } from 'fs';
import { FitFile } from './FitFile.js';

test('Fit File A', async () => {
  const buf = await readFileSync('./tests/data/Activity.fit');
  expect(FitFile.isFit(buf)).toBeTruthy();
  const fitFile = new FitFile(buf);
  expect(fitFile.getFirstSessionMessage().timestamp).toBeDefined();
});
