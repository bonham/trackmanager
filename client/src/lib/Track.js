import { DateTime } from 'luxon'
const sprintf = require('sprintf-js').sprintf
/**
 * Track class is representing a gpx track.
 *
 * It can calculate properties etc
 */
class Track {
  constructor (initData) { // id, name, length, src, time, timelength, ascent
    this.id = initData.id
    this.name = initData.name
    this.length = initData.length
    this.src = initData.src
    this.timelength = (initData.timelength === null ? 0 : initData.timelength)
    this.ascent = initData.ascent
    this.geojson = ('geojson' in initData ? initData.geojson : null)
    this.time = (initData.time === null ? null : DateTime.fromISO(initData.time))
  }

  distance () {
    return (this.length ? this.length : 0)
  }

  year () {
    if (this.time === null) {
      return '0 Unknown Year'
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

  secondsToHms (s) {
    const hms = {}

    hms.hours = Math.floor(s / 3600)
    hms.minutes = (s / 60) % 60
    hms.seconds = s % 60
    return hms
  }

  timeLengthHms () {
    return this.secondsToHms(this.timelength)
  }

  timeLengthFormatted () {
    const thms = this.timeLengthHms()
    return sprintf('%d:%02d', thms.hours, thms.minutes)
  }
}

const trackTableFields = [
  {
    key: 'name',
    label: 'Name',
    sortable: 'true'
  },
  {
    key: 'length',
    label: 'Length',
    sortable: 'true'
  },
  {
    key: 'src',
    label: 'File Name',
    sortable: 'true'
  },
  {
    key: 'time',
    label: 'Start Time',
    sortable: 'true'
  },
  {
    key: 'timelength',
    label: 'Duration',
    sortable: 'true'
  },
  {
    key: 'ascent',
    label: 'Ascent',
    sortable: 'true'
  }
]
class TrackCollection {
  constructor (listOfTracks) {
    this.tlist = listOfTracks
  }

  add (track) {
    this.tlist.push(track)
  }

  members () {
    return this.tlist
  }

  distance () {
    const sum = this.members().reduce((s, tr) => s + tr.distance(), 0)
    return sum
  }
}

export { Track, TrackCollection, trackTableFields }
