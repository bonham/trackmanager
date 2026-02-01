import { getTrackYears } from '@/lib/trackServices'
import { describe, vi, test, expect, beforeEach } from "vitest"

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('trackServices', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })
  test('getTrackYears', async () => {

    const sid = "mysid"
    const expectedResult = [2019, 2020, 2021]

    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        expectedResult
      )
    ))

    const yearList = await getTrackYears(sid)
    expect(yearList).toEqual(expectedResult)
  })
})
