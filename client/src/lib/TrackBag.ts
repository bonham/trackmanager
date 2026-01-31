import { Track } from '@/lib/Track'

class TrackBag {

  loadedTracks: Track[] = []
  tracksById: Record<number, Track> = {}

  setLoadedTracks(trackList: Track[]) {
    this.tracksById = {}
    this.loadedTracks = trackList
    trackList.forEach((el) => {
      const id = el.id
      this.tracksById[id] = el
    })
  }

  getLoadedTrackIds() {
    return this.loadedTracks.map(e => e.id)
  }

  getTrackById(id: number) {
    const t = this.tracksById[id]
    if (t === undefined) {
      throw new Error(`Track with id ${id} does not exist in trackbag`)
    } else {
      return t
    }
  }
}

export { TrackBag }