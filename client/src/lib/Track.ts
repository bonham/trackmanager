import { DateTime } from 'luxon'
import _ from 'lodash'
import type { GeoJsonObject } from 'geojson'


// const sprintf = require('sprintf-js').sprintf
import { sprintf } from 'sprintf-js'
/**
 * Track class is representing a gpx track.
 *
 * It can calculate properties etc
 */

type TrackProperties = {
  id: number,
  name: string,
  length: number,
  src: string,
  timelength: number,
  ascent: number,
  geojson: GeoJsonObject,
  time: DateTime
}

type TrackInitData = {
  id: number,
  name: string,
  length: number,
  src: string,
  timelength: number | null,
  ascent: number,
  geojson: GeoJsonObject | null,
  time: string | null
}
type TrackPropertiesOptional = {
  id?: number,
  name?: string,
  length?: number,
  src?: string,
  timelength?: number,
  ascent?: number,
  geojson?: GeoJsonObject,
  time?: DateTime | null | undefined
}

class Track {

  id: number
  name: string
  length: number
  src: string
  timelength: number
  ascent: number
  geojson: any
  time: DateTime | null | undefined

  constructor(initData: TrackInitData) { // id, name, length, src, time, timelength, ascent
    this.id = initData.id
    this.name = initData.name
    this.length = initData.length
    this.src = initData.src
    this.timelength = (initData.timelength === null ? 0 : initData.timelength)
    this.ascent = initData.ascent
    this.geojson = ('geojson' in initData ? initData.geojson : null)

    if (!initData.time) {
      this.time = null
    } else {
      const tmpTime = DateTime.fromISO(initData.time)
      if (tmpTime.isValid) {
        this.time = tmpTime
      } else {
        this.time = null
      }
    }
  }

  distance() {
    return (this.length ? this.length : 0)
  }

  year() {
    if (!this.time) {
      return 0
    } else {
      return this.time.year
    }
  }

  monthAndDay() {
    return (
      this.time
        ? this.time.toLocaleString({ month: 'long', day: 'numeric' })
        : 'Unknown Day'
    )
  }

  localeDateShort(opts?: Intl.DateTimeFormatOptions) {

    const ouropts = opts || DateTime.DATE_SHORT
    return (
      this.time
        ? this.time.toLocaleString(ouropts)
        : ''
    )
  }

  secondsToHms(s: number) {
    const hms = {
      hours: Math.floor(s / 3600),
      minutes: (s / 60) % 60,
      seconds: s % 60
    }
    return hms
  }

  timeLengthHms() {
    return this.secondsToHms(this.timelength)
  }

  timeLengthFormatted() {
    const thms = this.timeLengthHms()
    return sprintf('%d:%02d', thms.hours, thms.minutes)
  }

  secondsSinceEpoch() {
    return (this.time ? this.time.toSeconds() : 0)
  }
}

class TrackCollection {
  tlist: Track[]
  constructor(listOfTracks: Track[]) {
    this.tlist = []
    for (const track of listOfTracks) {
      this.add(track)
    }
  }

  add(track: Track) {
    this.tlist.push(track)
  }

  members() {
    return this.tlist
  }

  distance() {
    const sum = this.members().reduce((s, tr) => s + tr.distance(), 0)
    return sum
  }

  yearList() {
    const yList = this.members().map(x => x.year())
    return _.uniq(yList)
  }
}

export { Track, TrackCollection }
export type { TrackProperties, TrackPropertiesOptional, TrackInitData }
