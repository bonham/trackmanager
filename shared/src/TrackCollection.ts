import _ from 'lodash'
import type { Track } from './Track.js'

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

  ascent() {
    const sum = this.members().reduce((s, tr) => s + tr.getAscent(), 0)
    return sum
  }

  timeLength() {
    const sum = this.members().reduce((s, tr) => {
      const tl = tr.getTimeLength()
      return s + (tl ?? 0)
    }, 0)
    return sum
  }

  yearList() {
    const yList = this.members().map(x => x.year())
    return _.uniq(yList)
  }
}

export { TrackCollection }
