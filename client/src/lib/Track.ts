import { DateTime } from 'luxon'
import _ from 'lodash'
import type { GeoJsonObject } from 'geojson'


import { sprintf } from 'sprintf-js'
/**
 * Track class is representing a gpx track.
 *
 * It can calculate properties etc
 */



type TrackInitData = {
  id: number,
  name?: string | null,
  length?: number | null,
  length_calc?: number | null,
  src?: string | null,
  timelength?: number | null,
  timelength_calc?: number | null,
  ascent?: number | null,
  ascent_calc?: number | null,
  geojson?: GeoJsonObject | null,
  time?: string | null
}
type TrackPropertiesOptional = {
  id?: number,
  name?: string | null,
  length?: number | null,
  length_calc?: number | null,
  src?: string | null,
  timelength?: number | null,
  timelength_calc?: number | null,
  ascent?: number | null,
  ascent_calc?: number | null,
  geojson?: GeoJsonObject | null,
  time?: DateTime | null | undefined
}

interface TrackDataServerGetall {
  id: number,
  name: string | null,
  length: number | null,
  length_calc: number | null,
  src: string | null,
  time: string | null,
  timelength: number | null,
  timelength_calc: number | null,
  ascent: number | null,
  ascent_calc: number | null,
}

interface HMS {
  hours: number;
  minutes: number;
  seconds: number;
}

function isTrackDataServer(t: unknown): t is TrackDataServerGetall {
  if (
    typeof t === 'object' &&
    !!t &&
    "id" in t && (typeof t.id === 'number') &&
    "name" in t && (typeof t.name === 'string' || t.name === null) &&
    "length" in t && (typeof t.length === 'number' || t.length === null) &&
    "length_calc" in t && (typeof t.length_calc === 'number' || t.length_calc === null) &&
    "src" in t && (typeof t.src === 'string' || t.src === null) &&
    "time" in t && (typeof t.time === 'string' || t.time === null) &&
    "timelength" in t && (typeof t.timelength === 'number' || t.timelength === null) &&
    "timelength_calc" in t && (typeof t.timelength_calc === 'number' || t.timelength_calc === null) &&
    "ascent" in t && (typeof t.ascent === 'number' || t.ascent === null) &&
    "ascent_calc" in t && (typeof t.ascent_calc === 'number' || t.ascent_calc === null)
  ) {
    return true
  } else {
    return false
  }
}

function isTrackDataServerArray(t: unknown[]): t is TrackDataServerGetall[] {
  return t.every((ele) => {
    return isTrackDataServer(ele)
  })
}

class Track {

  id: number
  name: string | null
  length: number | null
  length_calc: number | null
  src: string | null
  timelength: number | null
  timelength_calc: number | null
  ascent: number | null
  ascent_calc: number | null
  geojson: GeoJsonObject | null
  time: DateTime | null | undefined

  constructor(initData: TrackInitData) { // id, name, length, src, time, timelength, ascent
    this.id = initData.id
    this.name = initData.name ?? null
    this.length = initData.length ?? null
    this.length_calc = initData.length_calc ?? null
    this.src = initData.src ?? null
    this.timelength = initData.timelength ?? null
    this.timelength_calc = initData.timelength_calc ?? null
    this.ascent = initData.ascent ?? null
    this.ascent_calc = initData.ascent_calc ?? null
    this.geojson = (('geojson' in initData && initData.geojson !== undefined) ? initData.geojson : null)

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

  getNameOrSrc() {
    return this.name?.trim() || (this.src ?? "")
  }

  getAscent() {
    if (this.ascent_calc) {
      return this.ascent_calc
    } else {
      return this.ascent ?? 0
    }
  }

  distance() {
    if (this.length_calc) {
      return this.length_calc
    } else {
      return this.length ?? 0
    }
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
    const hms: HMS = {
      hours: Math.floor(s / 3600),
      minutes: (s / 60) % 60,
      seconds: s % 60
    }
    return hms
  }

  /**
   * Get track duration
   * @returns Duration of tracks in seconds
   */
  getTimeLength() {
    if (this.timelength_calc) {
      return this.timelength_calc
    } else if (this.timelength === null) {
      return null
    } else {
      return this.timelength
    }
  }

  speedKmh() {
    const gtl = this.getTimeLength()
    if ((gtl !== null) && gtl > 0) {
      return (3.6 * this.distance() / gtl)
    } else {
      return null
    }
  }

  timeLengthHms(): HMS | null {
    const gtl = this.getTimeLength()
    if (gtl === null) {
      return null
    } else {
      return this.secondsToHms(gtl)
    }
  }

  timeLengthFormatted(): string {
    const thms = this.timeLengthHms()
    if (thms === null) {
      return ""
    } else return sprintf('%d:%02d', thms.hours, thms.minutes)
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

export { Track, TrackCollection, isTrackDataServer, isTrackDataServerArray }
export type { TrackPropertiesOptional, TrackInitData, TrackDataServerGetall }
