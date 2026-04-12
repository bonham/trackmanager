import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useErrorStore, reportError } from '@/stores/errorstore'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a fresh store for each test (pinia is reset in beforeEach). */
function getStore() {
  return useErrorStore()
}

// ---------------------------------------------------------------------------
// useErrorStore
// ---------------------------------------------------------------------------

describe('useErrorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // -----------------------------------------------------------------------
  // Initial state
  // -----------------------------------------------------------------------

  describe('initial state', () => {
    test('errors list is empty', () => {
      expect(getStore().errors).toHaveLength(0)
    })

    test('errorCount is 0', () => {
      expect(getStore().errorCount).toBe(0)
    })

    test('hasErrors is false', () => {
      expect(getStore().hasErrors).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // addError
  // -----------------------------------------------------------------------

  describe('addError', () => {
    test('appends an entry with the given message', () => {
      const store = getStore()
      store.addError('something broke')
      expect(store.errors[0]!.message).toBe('something broke')
    })

    test('assigns a timestamp close to the moment it was called', () => {
      const before = Date.now()
      const store = getStore()
      store.addError('ts-test')
      const after = Date.now()
      const ts = store.errors[0]!.timestamp.getTime()
      expect(ts).toBeGreaterThanOrEqual(before)
      expect(ts).toBeLessThanOrEqual(after)
    })

    test('stores the detail string when provided', () => {
      const store = getStore()
      store.addError('msg', 'detailed stack trace')
      expect(store.errors[0]!.detail).toBe('detailed stack trace')
    })

    test('leaves detail undefined when not provided', () => {
      const store = getStore()
      store.addError('msg')
      expect(store.errors[0]!.detail).toBeUndefined()
    })

    test('each successive call produces a distinct id', () => {
      const store = getStore()
      store.addError('first')
      store.addError('second')
      expect(store.errors[0]!.id).not.toBe(store.errors[1]!.id)
    })

    test('increments errorCount', () => {
      const store = getStore()
      store.addError('a')
      expect(store.errorCount).toBe(1)
      store.addError('b')
      expect(store.errorCount).toBe(2)
    })

    test('sets hasErrors to true as soon as one entry exists', () => {
      const store = getStore()
      store.addError('x')
      expect(store.hasErrors).toBe(true)
    })

    test('multiple errors are appended in order', () => {
      const store = getStore()
      store.addError('first')
      store.addError('second')
      store.addError('third')
      expect(store.errors.map(e => e.message)).toEqual(['first', 'second', 'third'])
    })
  })

  // -----------------------------------------------------------------------
  // MAX_ERRORS cap (200)
  // -----------------------------------------------------------------------

  describe('cap at 200 errors', () => {
    test('count stays at 200 when 201 errors are added', () => {
      const store = getStore()
      for (let i = 1; i <= 201; i++) store.addError(`msg-${i}`)
      expect(store.errors).toHaveLength(200)
    })

    test('the first (oldest) entry is evicted, not the newest', () => {
      const store = getStore()
      for (let i = 1; i <= 200; i++) store.addError(`msg-${i}`)
      const oldestMessage = store.errors[0]!.message

      store.addError('msg-201')

      expect(store.errors[0]!.message).not.toBe(oldestMessage)
      expect(store.errors[store.errors.length - 1]!.message).toBe('msg-201')
    })

    test('does not evict when adding exactly the 200th entry', () => {
      const store = getStore()
      for (let i = 1; i <= 199; i++) store.addError(`msg-${i}`)
      const firstMessageBefore = store.errors[0]!.message

      store.addError('msg-200')

      expect(store.errors).toHaveLength(200)
      expect(store.errors[0]!.message).toBe(firstMessageBefore)
    })
  })

  // -----------------------------------------------------------------------
  // dismissError
  // -----------------------------------------------------------------------

  describe('dismissError', () => {
    test('removes the entry with the matching id', () => {
      const store = getStore()
      store.addError('keep')
      store.addError('remove')
      const idToRemove = store.errors[1]!.id

      store.dismissError(idToRemove)

      expect(store.errors).toHaveLength(1)
      expect(store.errors[0]!.message).toBe('keep')
    })

    test('leaves all other entries intact when removing from the middle', () => {
      const store = getStore()
      store.addError('a')
      store.addError('b')
      store.addError('c')
      const middleId = store.errors[1]!.id

      store.dismissError(middleId)

      expect(store.errors.map(e => e.message)).toEqual(['a', 'c'])
    })

    test('is a no-op for an id that does not exist', () => {
      const store = getStore()
      store.addError('stays')
      const countBefore = store.errorCount

      store.dismissError(-999)

      expect(store.errorCount).toBe(countBefore)
      expect(store.errors[0]!.message).toBe('stays')
    })

    test('removing the last entry resets hasErrors to false', () => {
      const store = getStore()
      store.addError('only one')
      const id = store.errors[0]!.id

      store.dismissError(id)

      expect(store.hasErrors).toBe(false)
      expect(store.errorCount).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // dismissAll
  // -----------------------------------------------------------------------

  describe('dismissAll', () => {
    test('empties the error list', () => {
      const store = getStore()
      store.addError('a')
      store.addError('b')

      store.dismissAll()

      expect(store.errors).toHaveLength(0)
    })

    test('resets errorCount to 0', () => {
      const store = getStore()
      store.addError('x')

      store.dismissAll()

      expect(store.errorCount).toBe(0)
    })

    test('resets hasErrors to false', () => {
      const store = getStore()
      store.addError('x')

      store.dismissAll()

      expect(store.hasErrors).toBe(false)
    })

    test('is a no-op on an already empty store', () => {
      const store = getStore()

      expect(() => store.dismissAll()).not.toThrow()
      expect(store.errors).toHaveLength(0)
    })
  })
})

// ---------------------------------------------------------------------------
// reportError
// ---------------------------------------------------------------------------

describe('reportError', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('forwards all arguments to console.error', () => {
    reportError('something', 'extra context')
    expect(vi.mocked(console.error)).toHaveBeenCalledWith('something', 'extra context')
  })

  test('adds exactly one entry to the store', () => {
    const store = useErrorStore()
    reportError('boom')
    expect(store.errors).toHaveLength(1)
  })

  test('stores a plain string message verbatim', () => {
    const store = useErrorStore()
    reportError('network timeout')
    expect(store.errors[0]!.message).toBe('network timeout')
  })

  test('joins multiple string arguments with a space', () => {
    const store = useErrorStore()
    reportError('Error in', 'fetchData:', 'timed out')
    expect(store.errors[0]!.message).toBe('Error in fetchData: timed out')
  })

  test('formats an Error object as "Name: message"', () => {
    const store = useErrorStore()
    reportError(new TypeError('expected string, got number'))
    expect(store.errors[0]!.message).toBe('TypeError: expected string, got number')
  })

  test('stores the Error stack as the detail field', () => {
    const store = useErrorStore()
    const err = new Error('with stack')
    reportError(err)
    expect(store.errors[0]!.detail).toBe(err.stack)
  })

  test('concatenates a prefix string with a following Error', () => {
    const store = useErrorStore()
    reportError('failed to load track:', new RangeError('id out of range'))
    expect(store.errors[0]!.message).toBe('failed to load track: RangeError: id out of range')
  })

  test('detail is undefined when no Error is among the arguments', () => {
    const store = useErrorStore()
    reportError('plain string only')
    expect(store.errors[0]!.detail).toBeUndefined()
  })

  test('serializes a plain object as JSON', () => {
    const store = useErrorStore()
    reportError({ status: 503, url: '/api/tracks' })
    expect(store.errors[0]!.message).toBe('{"status":503,"url":"/api/tracks"}')
  })

  test('does not throw for a non-JSON-serializable value (circular reference)', () => {
    const store = useErrorStore()
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(() => reportError(circular)).not.toThrow()
    expect(store.errors).toHaveLength(1)
    expect(typeof store.errors[0]!.message).toBe('string')
  })

  test('uses the first Error stack even when multiple Errors are passed', () => {
    const store = useErrorStore()
    const err1 = new Error('first')
    const err2 = new Error('second')
    reportError(err1, err2)
    expect(store.errors[0]!.detail).toBe(err1.stack)
  })
})
