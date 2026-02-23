import { describe, expect, test } from 'vitest'
import { DateStringMatcher, StringCleaner } from '../../src/lib/analyzeString.js'

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

describe('DateStringMatcher.strippedString()', () => {
  test('removes international date from filename', () => {
    const result = new DateStringMatcher('activity_2021-03-14_run.gpx').strippedString()
    expect(result).not.toContain('2021-03-14')
    expect(result).toContain('activity')
    expect(result).toContain('run.gpx')
  })

  test('removes german date from filename', () => {
    const result = new DateStringMatcher('tour_31.05.2019_abend.gpx').strippedString()
    expect(result).not.toContain('31.05.2019')
  })

  test('returns unchanged string when no date present', () => {
    const input = 'nodatehere.gpx'
    expect(new DateStringMatcher(input).strippedString()).toBe(input)
  })

  test('removes date without separator', () => {
    const result = new DateStringMatcher('run20190531morning').strippedString()
    expect(result).not.toContain('20190531')
  })
})

describe('StringCleaner', () => {
  test('replaceConnectorsWithSpace replaces underscores and dashes', () => {
    const cleaner = new StringCleaner('hello_world-test')
    expect(cleaner.replaceConnectorsWithSpace()).toBe('hello world test')
  })

  test('replaceConnectorsWithSpace trims result', () => {
    const cleaner = new StringCleaner('_leading')
    const result = cleaner.replaceConnectorsWithSpace()
    expect(result).toBe('leading')
  })

  test('removeFileSuffix removes .gpx extension', () => {
    const cleaner = new StringCleaner('mytrack.gpx')
    expect(cleaner.removeFileSuffix(['gpx'])).toBe('mytrack')
  })

  test('removeFileSuffix is case-insensitive', () => {
    const cleaner = new StringCleaner('mytrack.GPX')
    expect(cleaner.removeFileSuffix(['gpx'])).toBe('mytrack')
  })

  test('removeFileSuffix removes .fit extension', () => {
    const cleaner = new StringCleaner('activity.fit')
    expect(cleaner.removeFileSuffix(['fit'])).toBe('activity')
  })

  test('removeFileSuffix does nothing when suffix not present', () => {
    const cleaner = new StringCleaner('mytrack.txt')
    expect(cleaner.removeFileSuffix(['gpx', 'fit'])).toBe('mytrack.txt')
  })

  test('removeKarooPrefix removes Karoo- prefix', () => {
    const cleaner = new StringCleaner('Karoo-activity_123')
    expect(cleaner.removeKarooPrefix()).toBe('activity_123')
  })

  test('removeKarooPrefix is case-insensitive', () => {
    const cleaner = new StringCleaner('karoo-something')
    expect(cleaner.removeKarooPrefix()).toBe('something')
  })

  test('removeKarooPrefix does nothing when prefix absent', () => {
    const cleaner = new StringCleaner('regular-name')
    expect(cleaner.removeKarooPrefix()).toBe('regular-name')
  })

  test('getString returns current string trimmed', () => {
    const cleaner = new StringCleaner('  hello  ')
    expect(cleaner.getString()).toBe('hello')
  })

  test('applyAll with suffixList removes suffix, prefix and connectors', () => {
    const cleaner = new StringCleaner('Karoo-my_track_2023.gpx')
    const result = cleaner.applyAll({ suffixList: ['gpx'] })
    expect(result).toBe('my track 2023')
  })

  test('applyAll without suffixList argument still runs (triggers ?? [] branch)', () => {
    const cleaner = new StringCleaner('hello_world')
    const result = cleaner.applyAll()
    expect(result).toBe('hello world')
  })

  test('applyAll with empty suffixList', () => {
    const cleaner = new StringCleaner('track.gpx')
    const result = cleaner.applyAll({ suffixList: [] })
    expect(result).toBe('track.gpx')
  })
})
