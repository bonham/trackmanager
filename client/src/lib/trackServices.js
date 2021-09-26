import { Track } from '@/lib/Track.js'
const _ = require('lodash')

async function getAllTracks () {
  const response = await fetch('/api/tracks')
  const responseJson = await response.json()

  const trackArray = responseJson.map(t => new Track(t))
  return trackArray
}

async function updateTrack (track, attributes) {
  const id = track.id
  const data = _.pick(track, attributes)

  const mybody = {
    updateAttributes: attributes,
    data: data
  }

  const req = new Request(
    `/api/tracks/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mybody)
    }

  )

  try {
    const response = await fetch(req)
    if (response.ok) {
      return true
    } else {
      console.error(`Unable to update track ${id}`)
      console.error(response)
      console.error(await response.text())
      return false
    }
  } catch (err) {
    console.error(err)
    return false
  }
}

export { getAllTracks, updateTrack }
