const { param, validationResult } = require('express-validator')

module.exports = [
  param('trackId').exists().isInt(),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log(errors.array())
      return res.status(400).end()
    } else {
      next()
    }
  }
]
