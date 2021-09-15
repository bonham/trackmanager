import { Track } from '@/lib/Track.js'

async function getAllTracks () {
  const response = await fetch('/api/tracks')
  const responseJson = await response.json()

  const trackArray = responseJson.map(t => new Track(t))
  return trackArray
}

export { getAllTracks }
