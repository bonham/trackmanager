const express = require('express');
const router = express.Router();
const { Client } = require('pg')
const logger = require('morgan');



/* GET users listing. */
router.get('/', function(req, res, next) {

  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'gpx1',
  })
  

  client.connect()
    .then(() => { return client.query("select id, name, length, src, time, timelength, ascent from tracks")})
    .then((result) => {
      res.json(result.rows)
    })
    .catch(err => {
      console.log(err)
      res.status(500).send(err.message)
    })
  
});

router.get('/:trackId', function(req, res, next) {

  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'gpx1',
  })
  
  trackId = req.params["trackId"]

  query = "select ST_AsGeoJSON(wkb_geometry) from tracks where id = '"+trackId+"'"
  logger(query)

  client.connect()
  .then(() => { return client.query(query)})
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
