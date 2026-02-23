import { describe, expect, test } from 'vitest';
import { isNextValQueryResult, isNumber } from '../../src/lib/typeguards.js';

describe('isNumber', () => {
  test('returns true for integer', () => {
    expect(isNumber(42)).toBe(true);
  });

  test('returns true for float', () => {
    expect(isNumber(3.14)).toBe(true);
  });

  test('returns true for zero', () => {
    expect(isNumber(0)).toBe(true);
  });

  test('returns false for string', () => {
    expect(isNumber('42')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isNumber(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isNumber(undefined)).toBe(false);
  });

  test('returns false for object', () => {
    expect(isNumber({})).toBe(false);
  });

  test('returns false for array', () => {
    expect(isNumber([])).toBe(false);
  });
});

describe('isNextValQueryResult', () => {
  test('returns true for object with string nextval', () => {
    expect(isNextValQueryResult({ nextval: '42' })).toBe(true);
  });

  test('returns false for object with numeric nextval', () => {
    expect(isNextValQueryResult({ nextval: 42 })).toBe(false);
  });

  test('returns falsy for null', () => {
    expect(isNextValQueryResult(null)).toBeFalsy();
  });

  test('returns falsy for undefined', () => {
    expect(isNextValQueryResult(undefined)).toBeFalsy();
  });

  test('returns false for empty object', () => {
    expect(isNextValQueryResult({})).toBe(false);
  });

  test('returns false for object without nextval', () => {
    expect(isNextValQueryResult({ other: 'val' })).toBe(false);
  });
});
