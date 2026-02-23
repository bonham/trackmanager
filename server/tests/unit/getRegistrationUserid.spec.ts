import { expect, test } from 'vitest';
import { getRegistrationUserId } from '../../src/routes/auth/lib/getRegistrationUserid.js';

test('getRegistrationUserId returns a non-empty string', () => {
  const result = getRegistrationUserId();
  expect(typeof result).toBe('string');
  expect(result.length).toBeGreaterThan(0);
});
