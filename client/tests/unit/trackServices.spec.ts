import {
  getTrackYears, getIdListByExtentAndTime, getTrackMetaDataByIdList, getTrackIdsByYear,
  getTracksByExtent, getTrackById, getAllTracks, getMultiLineStringWithIdList,
  updateTrack, updateTrackById, deleteTrack, updateNameFromSource,
} from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import { describe, vi, test, expect, beforeEach, beforeAll, afterAll } from 'vitest'

const trackData1 = {
  id: 1,
  name: 'Mountain Summit Trail',
  length: 12500,
  length_calc: 12480,
  src: 'uploaded_track_001.gpx',
  time: '2024-06-15T08:30:00.000Z',
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
  src: 'auto_recorded_2024.fit',
  time: '2024-08-22T14:15:00.000Z',
  timelength: null,
  timelength_calc: 3720,
  ascent: null,
  ascent_calc: 320,
}

const geoJsonData = [
  {
    id: 1,
    geojson: { type: 'MultiLineString' as const, coordinates: [[[0, 0], [1, 1]]] },
  },
]

const mockFetch = vi.fn<typeof fetch>()
vi.stubGlobal('fetch', mockFetch)

// Some source functions use `new Request(relativeUrl, ...)` before passing to fetch.
// Node.js's Request (undici) requires absolute URLs, so we extend it to prepend
// http://localhost for relative paths.
const OriginalRequest = globalThis.Request

class RelativeRequest extends OriginalRequest {
  constructor(input: string | URL | Request, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('/')) {
      super(`http://localhost${input}`, init)
    } else {
      super(input as string, init)
    }
  }
}

describe('trackServices', () => {
  beforeAll(() => {
    vi.stubGlobal('Request', RelativeRequest)
  })

  afterAll(() => {
    vi.stubGlobal('Request', OriginalRequest)
  })

  beforeEach(() => {
    mockFetch.mockReset()
  })

  describe('getIdListByExtentAndTime', () => {
    test('returns id list from server', async () => {
      const sid = 'mysid'
      const expectedResult = [1, 7, 9]
      mockFetch.mockResolvedValue(new Response(JSON.stringify(expectedResult)))

      const result = await getIdListByExtentAndTime([-10, -10, 10, 10], sid)

      expect(result).toEqual(expectedResult)
      const [url, init] = mockFetch.mock.calls[0]!
      expect(url).toBe(`/api/tracks/idlist/byextentbytime/sid/${sid}`)
      expect(init?.method).toBe('POST')
    })
  })

  describe('getAllTracks', () => {
    test('returns all tracks as Track instances', async () => {
      const sid = 'mysid'
      mockFetch.mockResolvedValue(new Response(JSON.stringify([trackData1, trackData2])))

      const result = await getAllTracks(sid)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Track)
      expect(result[1]).toBeInstanceOf(Track)
      const [url] = mockFetch.mock.calls[0]!
      expect(url).toBe(`/api/tracks/getall/sid/${sid}`)
    })
  })

  describe('getTrackYears', () => {
    test('returns year list on success', async () => {
      const sid = 'mysid'
      const expectedResult = [2019, 2020, 2021]
      mockFetch.mockResolvedValue(new Response(JSON.stringify(expectedResult)))

      const result = await getTrackYears(sid)

      expect(result).toEqual(expectedResult)
    })

    test('returns [] on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await getTrackYears('mysid')

      expect(result).toEqual([])
    })

    test('returns [] on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Server error', { status: 500 }))

      const result = await getTrackYears('mysid')

      expect(result).toEqual([])
    })

    test('returns [] on invalid JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('not-valid-json'))

      const result = await getTrackYears('mysid')

      expect(result).toEqual([])
    })
  })

  describe('getTrackIdsByYear', () => {
    test('returns id list for given year', async () => {
      const sid = 'mysid'
      const year = 2020
      const expectedResult = [5, 9, 7]
      mockFetch.mockResolvedValue(new Response(JSON.stringify(expectedResult)))

      const result = await getTrackIdsByYear(year, sid)

      expect(result).toEqual(expectedResult)
      const [url] = mockFetch.mock.calls[0]!
      expect(url).toBe(`/api/tracks/ids/byyear/${year}/sid/${sid}`)
    })

    test('throws when year is not an integer', async () => {
      await expect(getTrackIdsByYear(2020.5, 'mysid')).rejects.toThrow('Year is not integer')
    })

    test('returns [] on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await getTrackIdsByYear(2020, 'mysid')

      expect(result).toEqual([])
    })

    test('returns [] on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }))

      const result = await getTrackIdsByYear(2020, 'mysid')

      expect(result).toEqual([])
    })

    test('returns [] on invalid JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('not-valid-json'))

      const result = await getTrackIdsByYear(2020, 'mysid')

      expect(result).toEqual([])
    })
  })

  describe('getTracksByExtent', () => {
    test('returns Track list on success', async () => {
      const sid = 'mysid'
      mockFetch.mockResolvedValue(new Response(JSON.stringify([trackData1, trackData2])))

      const result = await getTracksByExtent([-10, -10, 10, 10], sid)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Track)
      const [url, init] = mockFetch.mock.calls[0]!
      expect(url).toBe(`/api/tracks/byextent/sid/${sid}`)
      expect(init?.method).toBe('POST')
    })

    test('returns [] on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await getTracksByExtent([], 'mysid')

      expect(result).toEqual([])
    })

    test('returns [] on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Server error', { status: 500 }))

      const result = await getTracksByExtent([], 'mysid')

      expect(result).toEqual([])
    })

    test('returns [] on invalid JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('not-valid-json'))

      const result = await getTracksByExtent([], 'mysid')

      expect(result).toEqual([])
    })
  })

  describe('getTrackById', () => {
    test('returns a Track instance on success', async () => {
      const sid = 'mysid'
      const id = 1
      mockFetch.mockResolvedValue(new Response(JSON.stringify(trackData1)))

      const result = await getTrackById(id, sid)

      expect(result).toBeInstanceOf(Track)
      expect(result?.id).toBe(id)
      const [url] = mockFetch.mock.calls[0]!
      expect(url).toBe(`/api/tracks/byid/${id}/sid/${sid}`)
    })

    test('returns null on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await getTrackById(1, 'mysid')

      expect(result).toBeNull()
    })

    test('returns null on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Not found', { status: 404 }))

      const result = await getTrackById(999, 'mysid')

      expect(result).toBeNull()
    })

    test('returns null on invalid JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('not-valid-json'))

      const result = await getTrackById(1, 'mysid')

      expect(result).toBeNull()
    })
  })

  describe('getTrackMetaDataByIdList', () => {
    test('returns Track list on success', async () => {
      const sid = 'mysid'
      const signal = new AbortController().signal
      mockFetch.mockResolvedValue(new Response(JSON.stringify([trackData1, trackData2])))

      const result = await getTrackMetaDataByIdList([1, 2], sid, signal)

      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Track)
      const [url, init] = mockFetch.mock.calls[0]!
      expect(url).toBe(`/api/tracks/bylist/sid/${sid}`)
      expect(init?.method).toBe('POST')
      expect(init?.signal).toBe(signal)
    })

    test('returns [] on AbortError', async () => {
      const abortError = new Error('AbortError')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      const result = await getTrackMetaDataByIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })

    test('returns [] on other network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await getTrackMetaDataByIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })

    test('returns [] on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Unauthorized', { status: 401 }))

      const result = await getTrackMetaDataByIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })

    test('returns [] on invalid JSON response', async () => {
      mockFetch.mockResolvedValue(new Response('not-valid-json'))

      const result = await getTrackMetaDataByIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })
  })

  describe('getMultiLineStringWithIdList', () => {
    test('returns geojson list on success', async () => {
      const sid = 'mysid'
      const signal = new AbortController().signal
      mockFetch.mockResolvedValue(new Response(JSON.stringify(geoJsonData)))

      const result = await getMultiLineStringWithIdList([1], sid, signal)

      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe(1)
    })

    test('returns [] on AbortError', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValue(abortError)

      const result = await getMultiLineStringWithIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })

    test('returns [] on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Server error', { status: 500 }))

      const result = await getMultiLineStringWithIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })

    test('returns [] on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await getMultiLineStringWithIdList([1], 'mysid', new AbortController().signal)

      expect(result).toEqual([])
    })
  })

  describe('updateTrackById', () => {
    test('returns true on ok response', async () => {
      const sid = 'mysid'
      const trackId = 1
      mockFetch.mockResolvedValue(new Response('{}'))

      const result = await updateTrackById(trackId, { name: 'New Name' }, sid)

      expect(result).toBe(true)
      const [fetchArg] = mockFetch.mock.calls[0]!
      if (fetchArg instanceof Request) {
        expect(fetchArg.url).toContain(`/api/tracks/byid/${trackId}/sid/${sid}`)
        expect(fetchArg.method).toBe('PUT')
      }
    })

    test('returns false on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Bad Request', { status: 400 }))

      const result = await updateTrackById(1, {}, 'mysid')

      expect(result).toBe(false)
    })

    test('returns false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await updateTrackById(1, {}, 'mysid')

      expect(result).toBe(false)
    })
  })

  describe('updateTrack', () => {
    test('calls updateTrackById with picked attributes', async () => {
      const sid = 'mysid'
      const track = new Track(trackData1)
      mockFetch.mockResolvedValue(new Response('{}'))

      await updateTrack(track, ['name', 'ascent'], sid)

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const [fetchArg] = mockFetch.mock.calls[0]!
      if (fetchArg instanceof Request) {
        expect(fetchArg.url).toContain(`/api/tracks/byid/${track.id}/sid/${sid}`)
      }
    })
  })

  describe('deleteTrack', () => {
    test('returns true on ok response', async () => {
      const sid = 'mysid'
      const trackId = 5
      mockFetch.mockResolvedValue(new Response(null, { status: 200 }))

      const result = await deleteTrack(trackId, sid)

      expect(result).toBe(true)
      const [fetchArg] = mockFetch.mock.calls[0]!
      if (fetchArg instanceof Request) {
        expect(fetchArg.url).toContain(`/api/tracks/byid/${trackId}/sid/${sid}`)
        expect(fetchArg.method).toBe('DELETE')
      }
    })

    test('returns false on non-ok response', async () => {
      mockFetch.mockResolvedValue(new Response('Not Found', { status: 404 }))

      const result = await deleteTrack(999, 'mysid')

      expect(result).toBe(false)
    })

    test('returns false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await deleteTrack(1, 'mysid')

      expect(result).toBe(false)
    })
  })

  describe('updateNameFromSource', () => {
    test('returns true on 204 response', async () => {
      const sid = 'mysid'
      const trackId = 3
      mockFetch.mockResolvedValue(new Response(null, { status: 204 }))

      const result = await updateNameFromSource(trackId, sid)

      expect(result).toBe(true)
      const [fetchArg] = mockFetch.mock.calls[0]!
      if (fetchArg instanceof Request) {
        expect(fetchArg.url).toContain(`/api/tracks/namefromsrc/${trackId}/sid/${sid}`)
        expect(fetchArg.method).toBe('PATCH')
      }
    })

    test('returns false on non-204 response', async () => {
      mockFetch.mockResolvedValue(new Response('Error', { status: 400 }))

      const result = await updateNameFromSource(1, 'mysid')

      expect(result).toBe(false)
    })

    test('returns false on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await updateNameFromSource(1, 'mysid')

      expect(result).toBe(false)
    })
  })
})
