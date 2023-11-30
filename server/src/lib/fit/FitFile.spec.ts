import { readFileSync } from 'fs';
import { FitFile } from './FitFile.js';

test('Fit File A', () => {
  const buf = readFileSync('./tests/data/Activity.fit');
  expect(FitFile.isFit(buf)).toBeTruthy();
  const fitFile = new FitFile(buf);
  expect(fitFile.getFirstSessionMessage().timestamp).toBeDefined();
});
