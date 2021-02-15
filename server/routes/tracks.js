var express = require('express');
var router = express.Router();
const { Client } = require('pg')

/* GET users listing. */
router.get('/', function(req, res, next) {

  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'tmp1',
  })
  client.connect()
  client.query('SELECT SRC from TRACKS', (err, sqlres) => {
    res.json(sqlres.rows)
    console.log(err, sqlres)
    client.end()
  })

});

module.exports = router;
