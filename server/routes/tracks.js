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
    .then(() => { return client.query("select src from tracks")})
    .then((result) => {
      res.json(
        result.rows.map((item) => { return item.src } )
      )
    })
    .catch(err => {
      console.log(err)
      res.status(500).send(err.message)
    })
  
});

module.exports = router;
