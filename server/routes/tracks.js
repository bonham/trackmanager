const express = require('express');
const router = express.Router();
const { Pool } = require('pg')
const logger = require('morgan');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gpx1',
})

/* GET users listing. */
router.get('/', function(req, res, next) {

  pool.query("select id, name, length, src, time, timelength, ascent from tracks")
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

  query = "select ST_AsGeoJSON(wkb_geometry,6,9) from tracks where id = '"+trackId+"'"
  logger(query)

  pool.query(query)
  .then((result) => {
    jsonString = result.rows[0]["st_asgeojson"]
    geoJson = JSON.parse(jsonString)
    res.json(geoJson)
  })
  .catch(err => {
    console.log(err)
    res.status(500).send(err.message)
  })
  
  
});

module.exports = router;
