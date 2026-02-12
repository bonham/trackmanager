import { getTrackYears, getIdListByExtentAndTime, getTrackMetaDataByIdList, getTrackIdsByYear } from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import { describe, vi, test, expect, beforeEach } from "vitest"


const trackData1 = {
  id: 1,
  name: "Mountain Summit Trail",
  length: 12500,
  length_calc: 12480,
  src: "uploaded_track_001.gpx",
  time: "2024-06-15T08:30:00.000Z",
  timelength: 5400,
  timelength_calc: 5380,
  ascent: 650,
  ascent_calc: 648,
}

const trackData2 = {
  id: 2,
  name: null,
  length: null,
  length_calc: 8920,
  src: "auto_recorded_2024.fit",
  time: "2024-08-22T14:15:00.000Z",
  timelength: null,
  timelength_calc: 3720,
  ascent: null,
  ascent_calc: 320,
}

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('trackServices', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('getIdListByExtentAndTime', async () => {

    const sid = "mysid"
    const expectedResult = [1, 7, 9]

    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        expectedResult
      )
    ))

    const yearList = await getIdListByExtentAndTime([], sid)
    expect(yearList).toEqual(expectedResult)
    expect((mockFetch.mock.calls[0]![1] as RequestInit).method).equals('POST')

  })

  test('getTrackMetaDataByIdList', async () => {

    const sid = "mysid"

    const trackDataList = [
      trackData1,
      trackData2
    ]

    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(trackDataList
      )
    ))

    const resultList = await getTrackMetaDataByIdList([1, 2], sid, new AbortController().signal)
    expect(resultList).not.toBeNull()
    expect(resultList).toHaveLength(2)
    expect(resultList[0]).toBeInstanceOf(Track)
    const requestInit = mockFetch.mock.calls[0]?.[1] as RequestInit | undefined
    expect(requestInit?.method).equals('POST')

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

  test('getTrackIdsByYear', async () => {

    const sid = "mysid"
    const expectedResult = [5, 9, 7]

    mockFetch.mockResolvedValue(new Response(
      JSON.stringify(
        expectedResult
      )
    ))

    const idList = await getTrackIdsByYear(2000, sid)
    expect(idList).toEqual(expectedResult)
  })
})
