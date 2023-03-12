import { DateTime } from 'luxon'
import _ from 'lodash'

// const sprintf = require('sprintf-js').sprintf
import { sprintf } from 'sprintf-js'
/**
 * Track class is representing a gpx track.
 *
 * It can calculate properties etc
 */

type TrackProperties =  {
  id: number,
  name: string,
  length: number,
  src: string,
  timelength: number,
  ascent: number,
  geojson: any,
  time: DateTime
}

type TrackInitData =  {
  id: number,
  name: string,
  length: number,
  src: string,
  timelength: number,
  ascent: number,
  geojson: any,
  timeString: string | null
  time: string
}
type TrackPropertiesOptional =  {
  id?: number,
  name?: string,
  length?: number,
  src?: string,
  timelength?: number,
  ascent?: number,
  geojson?: any,
  time?: DateTime
}

class Track {

  id: number
  name: string
  length: number
  src: string
  timelength: number
  ascent: number
  geojson: any
  time: null | DateTime

  constructor (initData: TrackInitData) { // id, name, length, src, time, timelength, ascent
    this.id = initData.id
    this.name = initData.name
    this.length = initData.length
    this.src = initData.src
    this.timelength = (initData.timelength === null ? 0 : initData.timelength)
    this.ascent = initData.ascent
    this.geojson = ('geojson' in initData ? initData.geojson : null)
    this.time = (initData.timeString === null ? null : DateTime.fromISO(initData.time))
  }

  distance () {
    return (this.length ? this.length : 0)
  }

  year () {
    if (this.time === null) {
      return 0
    } else {
      return this.time.year
    }
  }

  monthAndDay () {
    return (
      this.time === null
        ? 'Unknown Day'
        : this.time.toLocaleString({ month: 'long', day: 'numeric' })
    )
  }

  localeDateShort () {
    return (
      this.time === null
        ? ''
        : this.time.toLocaleString(DateTime.DATE_SHORT)
    )
  }

  secondsToHms (s: number) {
    const hms = {
      hours: Math.floor(s / 3600),
      minutes: (s / 60) % 60,
      seconds: s % 60
    }
    return hms
  }

  timeLengthHms () {
    return this.secondsToHms(this.timelength)
  }

  timeLengthFormatted () {
    const thms = this.timeLengthHms()
    return sprintf('%d:%02d', thms.hours, thms.minutes)
  }

  secondsSinceEpoch () {
    return (this.time ? this.time.toSeconds() : 0)
  }
}

class TrackCollection {
  tlist: Track[]
  constructor (listOfTracks: Track[]) {
    this.tlist = []
    for (const track of listOfTracks) {
      this.add(track)
    }
  }

  add (track: Track) {
    this.tlist.push(track)
  }

  members () {
    return this.tlist
  }

  distance () {
    const sum = this.members().reduce((s, tr) => s + tr.distance(), 0)
    return sum
  }

  yearList () {
    const yList = this.members().map(x => x.year())
    return _.uniq(yList)
  }
}

export { Track, TrackCollection }
export type { TrackProperties, TrackPropertiesOptional }
