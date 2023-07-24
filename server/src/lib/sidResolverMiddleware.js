const { param, validationResult } = require('express-validator');
const getSchema = require('./getSchema');

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Sid validation failed', errors.array());
    return res.status(401).end();
  }
  next();
  return undefined;
};

function createSidValidationChain(pool) {
  return [
    param('sid')
      .exists()
      .withMessage('Sid does not exist')
      .isAlphanumeric()
      .withMessage('Sid is not alphanum')
      .bail()
      .custom(async (value, { req }) => {
        const sid = value;
        const schema = await getSchema(sid, pool);
        if (schema === null) {
          throw new Error('Could not resolve schema');
        } else {
          req.schema = schema;
        }
      }),
    handleErrors,
  ];
}

module.exports = createSidValidationChain;
