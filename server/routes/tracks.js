const express = require('express')
const multer = require('multer')

const fs = require('fs')
const fsprom = require('fs/promises')
const path = require('path')
const _ = require('lodash')

const router = express.Router()
router.use(express.json()) // use builtin json body parser

const { Pool } = require('pg')
const { execFileSync } = require('child_process')

// configuration for data upload
const config = require('../config')
const { tracks: { database, uploadDir, python, gpx2dbScript } } = config
const uploadDirPrefix = 'trackmanager-upload-'

// sql query pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: database
})

/// // Get all tracks
router.get('/getall', async (req, res) => {
  try {
    const queryResult = await pool.query(
      'select id, name, length, src, ' +
      'time, timelength, ascent ' +
      'from tracks order by time')

    const rows = queryResult.rows
    // convert geojson string to object

    // for (let i = 0; i < rows.length; i++) {
    //   const jsonString = rows[i].geojson
    //   const geoJson = JSON.parse(jsonString)
    //   rows[i].geojson = geoJson
    // }

    res.json(rows)
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})

/// // Get Geojson for a list of ids. Payload { ids: [..] }
router.post('/geojson/', async (req, res) => {
  try {
    // validate expected property
    if (!(_.has(req.body, 'ids'))) {
      throw new Error('Request does not contain expected property')
    }
    const ids = req.body.ids

    // validate if value is a list
    if (!(_.isArray(ids))) {
      throw new Error('Ids does not contain array')
    }

    // validate integer
    const notIntegerList = _.reject(ids, (x) => (_.isInteger(x)))
    if (notIntegerList.length) throw Error('Found non integer elements in payload')

    const inClause = '(' + ids.join() + ')'
    const query = 'select id, ST_AsGeoJSON(wkb_geometry,6,3) as geojson ' +
      'from tracks where id in ' + inClause

    const queryResult = await pool.query(query)
    const rows = queryResult.rows

    const rowsWGeoJson = _.map(rows, (x) => ({ id: x.id, geojson: JSON.parse(x.geojson) }))

    res.json(rowsWGeoJson)
  } catch (err) {
    console.log(err)
    res.status(500).send(err.message)
  }
})

/// // Get single track id
router.get('/byid/:trackId', async (req, res) => {
  const trackId = req.params.trackId

  const query = 'select id, name, length, src,' +
    'time, timelength, ascent, ' +
    'ST_AsGeoJSON(wkb_geometry,6,3) as geojson ' +
    "from tracks where id = '" + trackId + "'"
  console.log(query)

  try {
    const queryResult = await pool.query(query)
    const row = queryResult.rows[0]
    const jsonString = row.geojson
    const geoJson = JSON.parse(jsonString)
    row.geojson = geoJson
    res.json(row)
  } catch (err) {
    console.error(err)
    res.status(500).send(err.message)
  }
})

/// // Update single track
router.put('/byid/:trackId', async (req, res) => {
  const updateAttributes = req.body.updateAttributes
  const data = req.body.data

  // filter out attributes not in data object
  const existingAttributes = updateAttributes.filter(x => (!(data[x] === undefined)))

  // compose query
  const halfCoalesced = existingAttributes.map(x => `${x} = '${data[x]}'`)
  const setExpression = halfCoalesced.join(',')

  const query = `update tracks set ${setExpression} where id = ${req.params.trackId}`
  console.log(query)

  try {
    const queryResult = await pool.query(query)
    const rowC = queryResult.rowCount
    if (rowC !== 1) {
      const msg = `Row count was not 1 after update statement, instead it was ${rowC}`
      console.err(msg)
      res.status(500).send(msg)
    }
  } catch (err) {
    console.err('Can not update tracks table')
    console.error(err)
    res.status(500).send(err)
  }

  res.end()
})

/// // Create new track from file upload
// initialization - multer - it is a middleware for uploading files

// Initializing a multer storage engine which will create unique
// upload directory for each file - to support multiple files with same name
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

// POST route for obtaining the contents of the file
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

  // run child process - execute python executable to process the upload
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
