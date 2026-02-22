import { describe, vi, test, expect, afterEach } from "vitest"
import { getSchemaConfig, getConfig } from "@/lib/getconfig.js"
import { Response } from 'cross-fetch'

const mockFetch = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', mockFetch)

describe("getSchemaConfig", () => {

  afterEach(() => {
    mockFetch.mockReset()
  })

  test("happy path", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        [
          { key: "TRACKSTYLE", value: "THREE_BROWN" },
          { key: "TRACKMAP_INITIALVIEW", value: "LATEST_YEAR" },
        ]
      )
    ))

    const expected = {
      TRACKSTYLE: "THREE_BROWN",
      TRACKMAP_INITIALVIEW: "LATEST_YEAR"
    }
    await expect(getSchemaConfig(sid)).resolves.toEqual(expected)
  })

  test("override one", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        [
          { key: "TRACKSTYLE", value: "THREE_BROWN" },
          { key: "TRACKMAP_INITIALVIEW", value: "ALL" },
        ]
      )
    ))

    const expected = {
      TRACKSTYLE: "THREE_BROWN",
      TRACKMAP_INITIALVIEW: "ALL"
    }
    await expect(getSchemaConfig(sid)).resolves.toEqual(expected)
  })

  test("one missing from server", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        [
          { key: "TRACKSTYLE", value: "THREE_BROWN" },
        ]
      )
    ))

    const expected = {
      TRACKSTYLE: "THREE_BROWN",
      TRACKMAP_INITIALVIEW: "LATEST_YEAR"
    }
    await expect(getSchemaConfig(sid)).resolves.toEqual(expected)
  })

  test("all missing from server", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        []
      )
    ))

    const expected = {
      TRACKSTYLE: "THREE_BROWN",
      TRACKMAP_INITIALVIEW: "LATEST_YEAR"
    }
    await expect(getSchemaConfig(sid)).resolves.toEqual(expected)
  })

  test("invalid value from server", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        [
          { key: "TRACKSTYLE", value: "WRONGVALUE" },
          { key: "TRACKMAP_INITIALVIEW", value: "LATEST_YEAR" },
        ]
      )
    ))

    await expect(getSchemaConfig(sid)).rejects.toThrow(Error("Not allowed value WRONGVALUE for config key TRACKSTYLE"))
  })

  test("invalid key from server", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        [
          { key: "WRONGKEY", value: "ANYVALUE" },
          { key: "TRACKMAP_INITIALVIEW", value: "LATEST_YEAR" },
        ]
      )
    ))

    await expect(getSchemaConfig(sid)).rejects.toThrow(Error("Not an allowed config key: WRONGKEY"))
  })

  test("array with elements missing key/value properties is rejected", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify([{ foo: "bar" }, { baz: 42 }])
    ))

    await expect(getSchemaConfig(sid)).rejects.toThrow(Error("Got wrong type from r.json()"))
  })

  test("non-ok HTTP response throws", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response("Internal Server Error", { status: 500 }))

    await expect(getSchemaConfig(sid)).rejects.toThrow(Error("Retrieving config not successful"))
  })

  test("non-array JSON response throws", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(JSON.stringify("just-a-string")))

    await expect(getSchemaConfig(sid)).rejects.toThrow(Error("Got wrong type from r.json()"))
  })

})

describe('getConfig', () => {
  afterEach(() => {
    mockFetch.mockReset()
  })

  test('returns value when server returns a valid value', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ value: 'FIVE_COLORFUL' })))

    const result = await getConfig('mysid', 'SCHEMA', 'TRACKSTYLE')

    expect(result).toBe('FIVE_COLORFUL')
  })

  test('returns default when server returns null value', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ value: null })))

    const result = await getConfig('mysid', 'SCHEMA', 'TRACKSTYLE')

    expect(result).toBe('THREE_BROWN')
  })

  test('throws on invalid conftype', async () => {
    await expect(getConfig('mysid', 'NOTVALID', 'TRACKSTYLE')).rejects.toThrow('Conftype not allowed: NOTVALID')
  })

  test('throws on invalid confkey', async () => {
    await expect(getConfig('mysid', 'SCHEMA', 'NOTAKEY')).rejects.toThrow('Not an allowed config key: NOTAKEY')
  })

  test('throws when HTTP response is not ok', async () => {
    mockFetch.mockResolvedValue(new Response('Server Error', { status: 500 }))

    await expect(getConfig('mysid', 'SCHEMA', 'TRACKSTYLE')).rejects.toThrow('Retrieving config not successful')
  })

  test('throws when server returns a disallowed value', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ value: 'INVALID_VALUE' })))

    await expect(getConfig('mysid', 'SCHEMA', 'TRACKSTYLE')).rejects.toThrow('Not allowed value INVALID_VALUE')
  })

  test('throws when response JSON is not the expected shape', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify('just-a-string')))

    await expect(getConfig('mysid', 'SCHEMA', 'TRACKSTYLE')).rejects.toThrow('Got wrong type from r.json()')
  })

  test('uses correct URL when fetching', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ value: 'ALL' })))

    await getConfig('mysid', 'SCHEMA', 'TRACKMAP_INITIALVIEW')

    const [url] = mockFetch.mock.calls[0]!
    expect(url).toBe('/api/config/get/sid/mysid/SCHEMA/TRACKMAP_INITIALVIEW')
  })
})