import { readFileSync } from 'fs';
import path from 'node:path';
import { expect, test } from 'vitest';
import { FitFile } from '../../src/lib/fit/FitFile.js';

test('Fit File A', () => {
  const buf = readFileSync(path.join(__dirname, '../data/Activity.fit'));
  expect(FitFile.isFit(buf)).toBeTruthy();
  const fitFile = new FitFile(buf);
  expect(fitFile.getFirstSessionMessage().timestamp).toBeDefined();
});
