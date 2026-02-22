import { describe, test, expect, vi, beforeEach } from 'vitest'
import { sendJSONToServer, getWithCORS, getErrorMessage } from '@/lib/httpHelpers'

const mockFetch = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', mockFetch)

describe('httpHelpers', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('sendJSONToServer', () => {
    test('sends POST with correct headers and body', async () => {
      const path = '/api/test'
      const payload = JSON.stringify({ key: 'value' })
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }))

      const result = await sendJSONToServer(path, payload)

      expect(result.status).toBe(200)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [url, init] = mockFetch.mock.calls[0]!
      expect(url).toBe(path)
      expect(init?.method).toBe('POST')
      expect(init?.body).toBe(payload)
      expect(init?.credentials).toBe('include')
    })

    test('sets Content-Type application/json header', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      await sendJSONToServer('/api/test', '{}')

      const [, init] = mockFetch.mock.calls[0]!
      const headers = init?.headers
      expect(headers).toBeInstanceOf(Headers)
      if (headers instanceof Headers) {
        expect(headers.get('Content-Type')).toBe('application/json')
      }
    })

    test('returns the response on success', async () => {
      mockFetch.mockResolvedValue(new Response('OK', { status: 201 }))

      const result = await sendJSONToServer('/api/resource', '"data"')

      expect(result.status).toBe(201)
    })

    test('returns non-ok response without throwing', async () => {
      mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }))

      const result = await sendJSONToServer('/api/missing', '{}')

      expect(result.ok).toBe(false)
      expect(result.status).toBe(404)
    })

    test('propagates fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(sendJSONToServer('/api/test', '{}')).rejects.toThrow('Network error')
    })
  })

  describe('getWithCORS', () => {
    test('sends GET with credentials include', async () => {
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }))

      const result = await getWithCORS('/api/data')

      expect(result.status).toBe(200)
      const [url, init] = mockFetch.mock.calls[0]!
      expect(url).toBe('/api/data')
      expect(init?.method).toBe('GET')
      expect(init?.credentials).toBe('include')
    })

    test('does not send a body', async () => {
      mockFetch.mockResolvedValue(new Response('{}'))

      await getWithCORS('/api/list')

      const [, init] = mockFetch.mock.calls[0]!
      expect(init?.body).toBeUndefined()
    })

    test('returns non-ok response without throwing', async () => {
      mockFetch.mockResolvedValue(new Response('Server Error', { status: 500 }))

      const result = await getWithCORS('/api/error')

      expect(result.ok).toBe(false)
      expect(result.status).toBe(500)
    })

    test('propagates fetch error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

      await expect(getWithCORS('/api/test')).rejects.toThrow('Failed to fetch')
    })
  })

  describe('getErrorMessage', () => {
    test('formats Error with name and message', () => {
      const error = new Error('something went wrong')
      expect(getErrorMessage(error)).toBe('Name: Error, Message: something went wrong')
    })

    test('formats TypeError with its name', () => {
      const error = new TypeError('type mismatch')
      expect(getErrorMessage(error)).toBe('Name: TypeError, Message: type mismatch')
    })

    test('formats RangeError with its name', () => {
      const error = new RangeError('out of range')
      expect(getErrorMessage(error)).toBe('Name: RangeError, Message: out of range')
    })

    test('formats SyntaxError with its name', () => {
      const error = new SyntaxError('invalid syntax')
      expect(getErrorMessage(error)).toBe('Name: SyntaxError, Message: invalid syntax')
    })

    test('handles string error value', () => {
      const msg = getErrorMessage('plain string error')
      expect(msg).toContain('Error object type string')
      expect(msg).toContain('Value: plain string error')
    })

    test('handles numeric error value', () => {
      const msg = getErrorMessage(42)
      expect(msg).toContain('Error object type number')
      expect(msg).toContain('Value: 42')
    })

    test('handles null', () => {
      const msg = getErrorMessage(null)
      expect(msg).toContain('Error object type object')
      expect(msg).toContain('Value: null')
    })

    test('handles undefined', () => {
      const msg = getErrorMessage(undefined)
      expect(msg).toContain('Error object type undefined')
      expect(msg).toContain('Value: undefined')
    })

    test('handles plain object', () => {
      const msg = getErrorMessage({ code: 123 })
      expect(msg).toContain('Error object type object')
    })

    test('handles Error with empty message', () => {
      const error = new Error('')
      expect(getErrorMessage(error)).toBe('Name: Error, Message: ')
    })
  })
})
