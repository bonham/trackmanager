const express = require('express');
const multer  = require('multer')

const path = require('path');
const fs = require('fs')
const os = require('os')

const router = express.Router();
const { Pool } = require('pg')


const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gpxall',
})

router.get('/', function(req, res, next) {

  pool.query("select id, name, length, src, time, timelength, ascent from tracks order by time")
    .then((result) => {
      res.json(result.rows)
    })
    .catch(err => {
      console.log(err)
      res.status(500).send(err.message)
    })
  
});

router.get('/:trackId', function(req, res, next) {

  trackId = req.params["trackId"]

  query = "select id, name, length, src,"+
    "time, timelength, ascent, "+
    "ST_AsGeoJSON(wkb_geometry,6,3) as geojson "+
    "from tracks where id = '"+trackId+"'"
  console.log(query)

  pool.query(query)
  .then((result) => {
    row = result.rows[0]
    jsonString = row["geojson"]
    geoJson = JSON.parse(jsonString)
    row["geojson"] = geoJson

    res.json(row)
  })
  .catch(err => {
    console.log(err)
    res.status(500).send(err.message)
  })
  
  
});

const prefix = path.join(os.tmpdir(), 'tm-upload-')
const uploadTmpdir = fs.mkdtempSync(prefix)
console.log(`Upload directory is ${uploadTmpdir}`)

const upload = multer({ dest: uploadTmpdir })

router.post('/addtrack', upload.single('newtrack'), function (req, res, next) {

  console.log(req.file, req.file.size)
  const filePath = req.file.path
  fs.unlink(filePath, (err) => {
    if (err) throw err
    console.log(`${filePath} was deleted`)
  })

  res.json({'message':'ok'})
})

module.exports = router;
