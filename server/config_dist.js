const os = require('os')

const config = {
  tracks: {
    database: 'postgresdatabasename',
    uploadDir: os.tmpdir(),
    python: 'C:\\Users\\Peter\\gpx_track_neighborhood\\python\\venvx\\Scripts\\python.exe',
    gpx2dbScript: 'C:\\Users\\Peter\\\\gpx_track_neighborhood\\python\\src\\gpx2db\\gpx2postgres.py'

  }
}
module.exports = config
