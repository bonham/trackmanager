const path = require('path')
const os = require('os')

const config = {
  tracks: {
    database: 'trackmanager2',
    uploadTmpDirPrefix: path.join(os.tmpdir(), 'tm-upload-'),
    python: 'C:\\Users\\Michael\\poc\\gpx_track_neighborhood\\venv\\Scripts\\python.exe',
    gpx2dbScript: 'C:\\Users\\Michael\\poc\\gpx_track_neighborhood\\gpx2postgres.py'

  }
}
module.exports = config
