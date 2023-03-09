const os = require('os')

const config = {
  tracks: {
    database: 'postgresdatabasename',
    uploadDir: os.tmpdir(),
    gpx2dbScript: 'C:\\Users\\Uli\\python\\venvx\\Scripts\\gpx2postgres.exe'

  }
}
module.exports = config
