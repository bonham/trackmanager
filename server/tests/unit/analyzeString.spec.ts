import { describe, expect, test } from 'vitest'
import { DateStringMatcher } from '../../src/lib/analyzeString.js'

function date(year: number, month: number, day: number): Date {
  return new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
}

describe('DateStringMatcher.extractDate()', () => {

  describe('international format YYYYMMDD', () => {
    test('no separator', () => {
      expect(new DateStringMatcher('20190531').extractDate()).toEqual(date(2019, 5, 31))
    })
    test('dot separator', () => {
      expect(new DateStringMatcher('2024.10.02').extractDate()).toEqual(date(2024, 10, 2))
    })
    test('dash separator', () => {
      expect(new DateStringMatcher('2024-10-02').extractDate()).toEqual(date(2024, 10, 2))
    })
    test('underscore separator', () => {
      expect(new DateStringMatcher('2024_10_02').extractDate()).toEqual(date(2024, 10, 2))
    })
    test('slash separator', () => {
      expect(new DateStringMatcher('2024/10/02').extractDate()).toEqual(date(2024, 10, 2))
    })
    test('date embedded in filename', () => {
      expect(new DateStringMatcher('activity_2021-03-14_run.gpx').extractDate()).toEqual(date(2021, 3, 14))
    })
    test('with time suffix HHMMSS (no separator)', () => {
      expect(new DateStringMatcher('20210314143000').extractDate()).toEqual(date(2021, 3, 14))
    })
  })

  describe('german format DDMMYYYY', () => {
    test('dot separator', () => {
      expect(new DateStringMatcher('02.10.2024').extractDate()).toEqual(date(2024, 10, 2))
    })
    test('dash separator', () => {
      expect(new DateStringMatcher('30-07-2021').extractDate()).toEqual(date(2021, 7, 30))
    })
    test('underscore separator', () => {
      expect(new DateStringMatcher('30_07_2021').extractDate()).toEqual(date(2021, 7, 30))
    })
    test('date embedded in filename', () => {
      expect(new DateStringMatcher('tour_31.05.2019_abend.gpx').extractDate()).toEqual(date(2019, 5, 31))
    })
  })

  describe('edge cases', () => {
    test('returns null for string without date', () => {
      expect(new DateStringMatcher('no-date-here').extractDate()).toBeNull()
    })
    test('returns null for empty string', () => {
      expect(new DateStringMatcher('').extractDate()).toBeNull()
    })
    test('january first', () => {
      expect(new DateStringMatcher('20000101').extractDate()).toEqual(date(2000, 1, 1))
    })
    test('december 31st', () => {
      expect(new DateStringMatcher('20991231').extractDate()).toEqual(date(2099, 12, 31))
    })
    test('21st century year prefix 21xx', () => {
      expect(new DateStringMatcher('21001231').extractDate()).toEqual(date(2100, 12, 31))
    })
  })
})
