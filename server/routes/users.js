var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json([
    {
      id: 1,
      name: "Peter"
    },
    {
      id: 2,
      name: "Paul"
    }
  ])
});

module.exports = router;
