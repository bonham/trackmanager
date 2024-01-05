import { describe, vi, test, expect, afterEach } from "vitest"
import { getSchemaConfig } from "@/lib/getconfig.js"
import { Response } from 'cross-fetch'

const mockFetch = vi.fn()
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
          { key: "TRACKMAP_INITIALVIEW", value: "THIS_YEAR" },
        ]
      )
    ))

    const expected = {
      TRACKSTYLE: "THREE_BROWN",
      TRACKMAP_INITIALVIEW: "THIS_YEAR"
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
      TRACKMAP_INITIALVIEW: "THIS_YEAR"
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
      TRACKMAP_INITIALVIEW: "THIS_YEAR"
    }
    await expect(getSchemaConfig(sid)).resolves.toEqual(expected)
  })

  test("invalid value from server", async () => {
    const sid = "mysid"
    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        [
          { key: "TRACKSTYLE", value: "WRONGVALUE" },
          { key: "TRACKMAP_INITIALVIEW", value: "THIS_YEAR" },
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
          { key: "TRACKMAP_INITIALVIEW", value: "THIS_YEAR" },
        ]
      )
    ))

    await expect(getSchemaConfig(sid)).rejects.toThrow(Error("Not an allowed config key: WRONGKEY"))
  })

})