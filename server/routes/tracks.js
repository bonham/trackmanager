const express = require('express');
const router = express.Router();
const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'gpxall',
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

module.exports = router;
