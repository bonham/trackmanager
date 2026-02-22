import { describe, test, expect, vi, beforeEach } from 'vitest'
import { createTrackLoadingAsyncWorker, type Task } from '@/lib/trackLoadAsyncWorker'
import * as trackServices from '@/lib/trackServices'
import { Track } from '@/lib/Track'
import type { MultiLineStringWithTrack } from '@/lib/zodSchemas'

vi.mock('@/lib/trackServices', () => ({
  getTrackMetaDataByIdList: vi.fn(),
  getMultiLineStringWithIdList: vi.fn(),
}))

/**
 * AsyncWorker<Task> is typed as (task, callback) => void but the implementation
 * is an async function. This helper casts it to a directly-awaitable form for tests.
 * One cast in one place avoids repetition across all tests.
 */
type AwaitableWorker = (task: Task) => Promise<void>
function asAwaitable(worker: ReturnType<typeof createTrackLoadingAsyncWorker>): AwaitableWorker {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return worker as any as AwaitableWorker
}

const track1 = new Track({
  id: 1, name: 'Track 1', length: 1000, length_calc: 1050,
  src: 'track1.gpx', time: '2024-01-01T10:00:00.000Z',
  timelength: 600, timelength_calc: 630, ascent: 100, ascent_calc: 110,
})
const track2 = new Track({
  id: 2, name: 'Track 2', length: 2000, length_calc: 2100,
  src: 'track2.gpx', time: '2024-01-02T10:00:00.000Z',
  timelength: 1200, timelength_calc: 1260, ascent: 200, ascent_calc: 220,
})
const geoJson1 = { id: 1, geojson: { type: 'MultiLineString' as const, coordinates: [[[0, 0], [1, 1]]] } }
const geoJson2 = { id: 2, geojson: { type: 'MultiLineString' as const, coordinates: [[[0, 0], [2, 2]]] } }

describe('createTrackLoadingAsyncWorker', () => {
  const mockedGetTrackMetaData = vi.mocked(trackServices.getTrackMetaDataByIdList)
  const mockedGetMultiLineString = vi.mocked(trackServices.getMultiLineStringWithIdList)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns a function', () => {
    const worker = createTrackLoadingAsyncWorker(vi.fn(), 'sid')
    expect(typeof worker).toBe('function')
  })

  test('fetches metadata and geojson then calls addToLayerFunction for each id', async () => {
    const addFn = vi.fn()
    const sid = 'test-sid'
    const controller = new AbortController()
    const task: Task = { idList: [1, 2], signal: controller.signal }

    mockedGetTrackMetaData.mockResolvedValue([track1, track2])
    mockedGetMultiLineString.mockResolvedValue([geoJson1, geoJson2])

    await asAwaitable(createTrackLoadingAsyncWorker(addFn, sid))(task)

    expect(mockedGetTrackMetaData).toHaveBeenCalledWith([1, 2], sid, controller.signal)
    expect(mockedGetMultiLineString).toHaveBeenCalledWith([1, 2], sid, controller.signal)
    expect(addFn).toHaveBeenCalledTimes(2)

    const firstCallArg = addFn.mock.calls[0]?.[0] as MultiLineStringWithTrack
    expect(firstCallArg.track.id).toBe(1)
    expect(firstCallArg.geojson).toEqual(geoJson1.geojson)

    const secondCallArg = addFn.mock.calls[1]?.[0] as MultiLineStringWithTrack
    expect(secondCallArg.track.id).toBe(2)
    expect(secondCallArg.geojson).toEqual(geoJson2.geojson)
  })

  test('returns early without fetching when signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    const task: Task = { idList: [1], signal: controller.signal }

    await asAwaitable(createTrackLoadingAsyncWorker(vi.fn(), 'sid'))(task)

    expect(mockedGetTrackMetaData).not.toHaveBeenCalled()
    expect(mockedGetMultiLineString).not.toHaveBeenCalled()
  })

  test('returns early after metadata fetch when signal is aborted', async () => {
    const addFn = vi.fn()
    const controller = new AbortController()
    const task: Task = { idList: [1], signal: controller.signal }

    mockedGetTrackMetaData.mockResolvedValue([track1])
    mockedGetMultiLineString.mockImplementation(() => {
      controller.abort()
      return Promise.resolve([])
    })

    await asAwaitable(createTrackLoadingAsyncWorker(addFn, 'sid'))(task)

    expect(addFn).not.toHaveBeenCalled()
  })

  test('handles empty id list without calling addToLayerFunction', async () => {
    const addFn = vi.fn()
    const task: Task = { idList: [], signal: new AbortController().signal }

    mockedGetTrackMetaData.mockResolvedValue([])
    mockedGetMultiLineString.mockResolvedValue([])

    await asAwaitable(createTrackLoadingAsyncWorker(addFn, 'sid'))(task)

    expect(addFn).not.toHaveBeenCalled()
  })

  test('throws when track metadata is missing for an id', async () => {
    const task: Task = { idList: [1, 2], signal: new AbortController().signal }

    mockedGetTrackMetaData.mockResolvedValue([track1]) // only track1, missing track2
    mockedGetMultiLineString.mockResolvedValue([geoJson1, geoJson2])

    await expect(
      asAwaitable(createTrackLoadingAsyncWorker(vi.fn(), 'sid'))(task)
    ).rejects.toThrow('Track for id 2 is undefined')
  })

  test('throws when geojson is missing for an id', async () => {
    const task: Task = { idList: [1, 2], signal: new AbortController().signal }

    mockedGetTrackMetaData.mockResolvedValue([track1, track2])
    mockedGetMultiLineString.mockResolvedValue([geoJson1]) // only geoJson1, missing geoJson2

    await expect(
      asAwaitable(createTrackLoadingAsyncWorker(vi.fn(), 'sid'))(task)
    ).rejects.toThrow('GeoJson for id 2 is undefined')
  })

  test('throws when getTrackMetaDataByIdList returns null', async () => {
    const task: Task = { idList: [1], signal: new AbortController().signal }

    // The `=== null` check in the worker is a defensive guard; the function's
    // return type is `Track[]`, so a cast is needed to exercise this dead branch.
    mockedGetTrackMetaData.mockResolvedValue(null as unknown as Track[])

    await expect(
      asAwaitable(createTrackLoadingAsyncWorker(vi.fn(), 'sid'))(task)
    ).rejects.toThrow('Track metadata list could not be loaded')
  })

  test('processes single track correctly', async () => {
    const addFn = vi.fn()
    const task: Task = { idList: [1], signal: new AbortController().signal }

    mockedGetTrackMetaData.mockResolvedValue([track1])
    mockedGetMultiLineString.mockResolvedValue([geoJson1])

    await asAwaitable(createTrackLoadingAsyncWorker(addFn, 'sid'))(task)

    expect(addFn).toHaveBeenCalledTimes(1)
    const arg = addFn.mock.calls[0]?.[0] as MultiLineStringWithTrack
    expect(arg.track).toBe(track1)
    expect(arg.geojson).toEqual(geoJson1.geojson)
  })
})
