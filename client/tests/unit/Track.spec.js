import { Track, TrackCollection } from '@/lib/Track.js'
import { DateTime } from 'luxon'

const initData1 = {
  id: 1,
  name: 'mytrack1',
  length: 13.4,
  src: 'mysrc1',
  ascent: 134.5,
  time: DateTime.local(2017, 5, 15, 9, 10, 23)
}

const initData2 = {
  id: 1,
  name: 'mytrack2',
  length: 23.4,
  src: 'mysrc2',
  ascent: 234.5,
  time: DateTime.local(2027, 5, 25, 9, 20, 23)
}

describe('Basic Track Object', () => {
  test('Init Track', () => {
    const track1 = new Track(initData1)
    expect(track1.distance()).toEqual(13.4)
    expect(track1.year()).toEqual(2017)
    const timeLocaleString = initData1.time.toLocaleString({ month: 'long', day: 'numeric' })
    expect(track1.monthAndDay()).toEqual(timeLocaleString)
  })
})

describe('TrackCollection', () => {
  test('basic test', () => {
    const t1 = new Track(initData1)
    const t2 = new Track(initData2)
    const tc = new TrackCollection([t1, t2])
    expect(tc.members().length).toEqual(2)
  })

  test('check distance', () => {
    const t1 = new Track(initData1)
    const t2 = new Track(initData2)
    const tc = new TrackCollection([t1, t2])
    expect(tc.distance()).toEqual(36.8)
  })

  test('check year list', () => {
    const t1 = new Track(initData1)
    const t2 = new Track(initData2)
    const tc = new TrackCollection([t1, t2, t1])
    expect(tc.yearList().sort()).toEqual([2017, 2027])
  })
})
