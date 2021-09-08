const os = require('os')

const config = {
  tracks: {
    database: 'trackmanager2',
    uploadDir: os.tmpdir(),
    python: 'C:\\Users\\Michael\\poc\\gpx_track_neighborhood\\venv\\Scripts\\python.exe',
    gpx2dbScript: 'C:\\Users\\Michael\\poc\\gpx_track_neighborhood\\gpx2postgres.py'

  }
}
module.exports = config
