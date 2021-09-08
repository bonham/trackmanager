const express = require('express')
const multer = require('multer')

const fs = require('fs')
const fsprom = require('fs/promises')
const path = require('path')

const router = express.Router()
const { Pool } = require('pg')
const { execFileSync } = require('child_process')

// config
const config = require('../config')
const { tracks: { database, uploadDir, python, gpx2dbScript } } = config
const uploadDirPrefix = 'trackmanager-upload-'

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: database
})

router.get('/', function (req, res, next) {
  pool.query('select id, name, length, src, time, timelength, ascent from tracks order by time')
    .then((result) => {
      res.json(result.rows)
    })
    .catch(err => {
      console.log(err)
      res.status(500).send(err.message)
    })
})

router.get('/:trackId', function (req, res, next) {
  const trackId = req.params.trackId

  const query = 'select id, name, length, src,' +
    'time, timelength, ascent, ' +
    'ST_AsGeoJSON(wkb_geometry,6,3) as geojson ' +
    "from tracks where id = '" + trackId + "'"
  console.log(query)

  pool.query(query)
    .then((result) => {
      const row = result.rows[0]
      const jsonString = row.geojson
      const geoJson = JSON.parse(jsonString)
      row.geojson = geoJson

      res.json(row)
    })
    .catch(err => {
      console.log(err)
      res.status(500).send(err.message)
    })
})

// initialization - multer - it is a middleware for uploading files

// multer storage engine
const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    const newDestinationPrefix = path.join(uploadDir, uploadDirPrefix)
    const newDestination = fs.mkdtempSync(newDestinationPrefix)
    cb(null, newDestination)
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }

})

// multer object
const upload = multer(
  {
    limits: {
      fieldNameSize: 100,
      fileSize: 60000000
    },
    storage: storage
  }
)

// route
router.post('/addtrack', upload.single('newtrack'), function (req, res, next) {
  console.log(req.file, req.file.size)
  const filePath = req.file.path
  const uploadDir = req.file.destination

  // build arguments
  const args = [
    gpx2dbScript,
    // '--createdb',
    filePath,
    database
  ]

  // run child process
  try {
    const out = execFileSync(python, args)
    console.log('Stdout ', out)
  } catch (err) {
    console.log('Child error', err.message)
    res.status(422).json({ message: err.message })
    return
  } finally {
    // cleanup of file and directory
    fsprom.rmdir(uploadDir, { recursive: true }).then(
      (result) => console.log('Success'),
      (err) => { console.log('Error, could not remove directory', err) }
    )
  }

  res.json({ message: 'ok' })
})

module.exports = router
