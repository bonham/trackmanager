const getSchema = require('../lib/getSchema')

function validateSidFormat (req, res, next) {
  if (!('sid' in req.params)) {
    console.log('Missing sid')
    res.status(401).end()
    return
  }
  const sid = req.params.sid
  const alphanum = /^[a-z0-9]+$/
  if (!alphanum.test(sid)) {
    console.log(`Sid value is not alphanumeric: ${sid}`)
    res.status(401).end()
    return
  }
  next()
}

async function validateSidExistsGenerator (req, res, next, pool) {
  const sid = req.params.sid
  const schema = await getSchema(sid, pool)
  if (schema === null) {
    console.log(`Sid ${sid} could not be resolved to schema`)
    res.status(401).end()
  } else {
    req.schema = schema
    next()
  }
}

function createSidValidationChain (pool) {
  return [
    validateSidFormat,
    (req, res, next) => validateSidExistsGenerator(req, res, next, pool)
  ]
}

module.exports = createSidValidationChain

// const { isAlpha, validationResult } = require('express-validator')

// const sidResolver = function (req, res, next) {
//   // checks if sid present and contains alphanumeric chars only
//   // if not -> 401
//   // check if sid can be resolved to schema
//   // if not -> 401
//   // schema is passed to next handler

//   const schema = getSchema(sid)
// }
