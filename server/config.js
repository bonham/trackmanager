const os = require('os')

const config = {
  tracks: {
    database: 'trackmanager3',
    uploadDir: os.tmpdir(),
    python: 'C:\\Users\\Michael\\poc\\gpx_track_neighborhood\\python\\venvx\\Scripts\\python.exe',
    gpx2dbScript: 'C:\\Users\\Michael\\poc\\gpx_track_neighborhood\\python\\src\\gpx2db\\gpx2postgres.py'

  }
}
module.exports = config
