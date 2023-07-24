const { param, validationResult } = require('express-validator');

module.exports = [
  param('year').exists().isInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).end();
    }
    next();
    return undefined;
  },
];
