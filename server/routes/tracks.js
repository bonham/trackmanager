const express = require('express')
const multer = require('multer')

const fs = require('fs')

const router = express.Router()
const { Pool } = require('pg')
const { execFileSync } = require('child_process')

// config
const config = require('../config')
const { tracks: { database, uploadTmpDirPrefix, python, gpx2dbScript } } = config

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

// tmpdir calculation
const uploadTmpdir = fs.mkdtempSync(uploadTmpDirPrefix)
console.log(`Upload directory is ${uploadTmpdir}`)

// initialization
const upload = multer({ dest: uploadTmpdir })

// route
router.post('/addtrack', upload.single('newtrack'), function (req, res, next) {
  console.log(req.file, req.file.size)
  const filePath = req.file.path

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
    // cleanup
    fs.unlink(filePath, (err) => {
      if (err) throw err
      console.log(`${filePath} was deleted`)
    })
  }

  res.json({ message: 'ok' })
})

module.exports = router
