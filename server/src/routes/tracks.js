require('dotenv').config();
const os = require('os');

const express = require('express');
const multer = require('multer');

const fs = require('fs');
const fsprom = require('fs/promises');
const path = require('path');
// eslint-disable-next-line @typescript-eslint/naming-convention
const _ = require('lodash');

const router = express.Router();
router.use(express.json()); // use builtin json body parser

const { Pool } = require('pg');
const { execFileSync } = require('child_process');
const createSidValidationChain = require('../lib/sidResolverMiddleware');
const trackIdValidationMiddleware = require('../lib/trackIdValidationMiddleware');
const yearValidation = require('../lib/yearValidation');

const SIMPLIFY_DISTANCE = 2;

const uploadDir = process.env.UPLOAD_DIR || os.tmpdir();
const database = process.env.TM_DATABASE;
const gpx2dbScript = process.env.GPX2DBSCRIPT;
const uploadDirPrefix = 'trackmanager-upload-';

// sql query pool
const poolOptions = {
  user: 'postgres',
  host: 'localhost',
  database,
};
const pool = new Pool(poolOptions);
const sidValidationChain = createSidValidationChain(pool);

router.get(
  '/getall/sid/:sid',
  sidValidationChain,
  async (req, res) => {
    const { schema } = req;
    try {
      const queryResult = await pool.query(
        'select id, name, length, src, '
        + 'time, timelength, ascent '
        + `from ${schema}.tracks order by time`,
      );

      const { rows } = queryResult;
      // convert geojson string to object

      // for (let i = 0; i < rows.length; i++) {
      //   const jsonString = rows[i].geojson
      //   const geoJson = JSON.parse(jsonString)
      //   rows[i].geojson = geoJson
      // }

      res.json(rows);
    } catch (err) {
      console.trace('Exception handling trace');
      console.log(err);
      res.status(500).send(err.message);
    }
  },
);

/// // Get Geojson for a list of ids. Payload { ids: [..] }
// result: { id: x.id, geojson: { .. } }
router.post(
  '/geojson/sid/:sid',
  sidValidationChain,
  async (req, res) => {
    const { schema } = req;
    try {
      // validate expected property
      if (!(_.has(req.body, 'ids'))) {
        throw new Error('Request does not contain expected property');
      }
      const { ids } = req.body;

      // validate if value is a list
      if (!(_.isArray(ids))) {
        throw new Error('Ids does not contain array');
      }

      // zero payload
      if (ids.length === 0) {
        res.json([]);
      }

      // validate integer
      const notIntegerList = _.reject(ids, (x) => (_.isInteger(x)));
      if (notIntegerList.length) throw Error('Found non integer elements in payload');

      const inClause = `(${ids.join()})`;
      const query = 'select id, ST_AsGeoJSON(wkb_geometry,6,3) as geojson '
        + `from ${schema}.tracks where id in ${inClause}`;

      const queryResult = await pool.query(query);
      const { rows } = queryResult;

      const rowsWGeoJson = _.map(rows, (x) => ({ id: x.id, geojson: JSON.parse(x.geojson) }));

      res.json(rowsWGeoJson);
    } catch (err) {
      console.trace('Exception handling trace');
      console.log(err);
      res.status(500).send(err.message);
    }
  },
);

/// // Get single track id
router.get(
  '/byid/:trackId/sid/:sid',
  sidValidationChain,
  trackIdValidationMiddleware,
  async (req, res) => {
    const { schema } = req;
    const { trackId } = req.params;

    const query = 'select id, name, length, src,'
      + 'time, timelength, ascent '
      + `from ${schema}.tracks where id = '${trackId}'`;

    let rows;
    try {
      const queryResult = await pool.query(query);
      rows = queryResult.rows;
    } catch (err) {
      console.trace('Exception handling trace');
      console.error(err);
      res.status(500).send(err.message);
    }

    if (rows.length === 0) {
      res.status(404).end();
    } else {
      const row = rows[0];
      res.json(row);
    }
  },
);

/// // Get list of tracks by year
router.get(
  '/byyear/:year/sid/:sid',
  sidValidationChain,
  yearValidation,
  async (req, res) => {
    const { schema } = req;
    const { year } = req.params;

    let whereClause;
    if (year === '0') {
      whereClause = 'time is null';
    } else {
      whereClause = `extract(YEAR from time) = ${year}`;
    }

    const query = 'select id, name, length, src,'
      + 'time, timelength, ascent '
      + `from ${schema}.tracks where ${whereClause}`;
    console.log(query);
    try {
      const queryResult = await pool.query(query);
      res.json(queryResult.rows);
    } catch (err) {
      console.trace('Exception handling trace');
      console.error(err);
      res.status(500).send(err.message);
    }
  },
);

/// // Update single track
router.put(
  '/byid/:trackId/sid/:sid',
  sidValidationChain,
  trackIdValidationMiddleware,
  async (req, res) => {
    const { schema } = req;
    const { updateAttributes } = req.body;
    const { data } = req.body;

    // filter out attributes not in data object
    const existingAttributes = updateAttributes.filter((x) => (!(data[x] === undefined)));

    // compose query
    const halfCoalesced = existingAttributes.map((x) => `${x} = '${data[x]}'`);
    const setExpression = halfCoalesced.join(',');

    const query = `update ${schema}.tracks set ${setExpression} where id = ${req.params.trackId}`;
    console.log(query);

    try {
      const queryResult = await pool.query(query);
      const rowC = queryResult.rowCount;
      if (rowC === 0) {
        res.status(404).send('HTTP 404');
      } else if (rowC !== 1) {
        const msg = `Row count was not 1 after update statement, instead it was ${rowC}`;
        console.error(msg);
        res.status(500).send(msg);
      } else {
        res.status(200).send('OK');
      }
    } catch (err) {
      console.trace('Exception handling trace');
      console.error('Can not update tracks table');
      console.error(err);
      res.status(500).send(err);
    }
  },
);

/// // Delete single track
router.delete(
  '/byid/:trackId/sid/:sid',
  sidValidationChain,
  trackIdValidationMiddleware,
  async (req, res) => {
    const { schema } = req;
    const { trackId } = req.params;

    const query1 = `delete from ${schema}.track_points `
      + `where track_id = ${trackId}`;

    const query2 = `delete from ${schema}.segments `
      + `where track_id = ${trackId}`;

    const query3 = `delete from ${schema}.tracks `
      + `where id = ${trackId}`;

    try {
      await pool.query(query1);
      await pool.query(query2);
      const queryResult = await pool.query(query3);
      const rowC = queryResult.rowCount;
      if (rowC === 0) {
        res.status(404).send('HTTP 404');
      } else if (rowC !== 1) {
        const msg = `Row count was not 1 after update statement, instead it was ${rowC}`;
        console.error(msg);
        res.status(500).send(msg);
      } else {
        res.status(200).send('OK');
      }
    } catch (err) {
      console.trace('Exception handling trace');
      console.error('Can not delete track from table');
      console.error(err);
      res.status(500).send(err);
    }
  },
);

/// // Create new track from file upload
// initialization - multer - it is a middleware for uploading files

// Initializing a multer storage engine which will create unique
// upload directory for each file - to support multiple files with same name
const storage = multer.diskStorage({

  destination(req, file, cb) {
    const newDestinationPrefix = path.join(uploadDir, uploadDirPrefix);
    const newDestination = fs.mkdtempSync(newDestinationPrefix);
    cb(null, newDestination);
  },

  filename(req, file, cb) {
    cb(null, file.originalname);
  },

});

// multer object
const upload = multer(
  {
    limits: {
      fieldNameSize: 100,
      fileSize: 60000000,
    },
    storage,
  },
);

// POST route for handling gpx track file uploads.
router.post(
  '/addtrack/sid/:sid',
  sidValidationChain,
  upload.single('newtrack'),
  async (req, res) => {
    const { schema } = req;

    console.log(req.file, req.file.size);
    const filePath = req.file.path;
    const uploadDirectory = req.file.destination;

    // build arguments
    const args = [
      '-s',
      SIMPLIFY_DISTANCE,
      filePath,
      database,
      schema,
    ];

    // run child process - execute python executable to process the upload
    let stdout = '';
    try {
      console.log('Command: ', gpx2dbScript, args);
      stdout = execFileSync(gpx2dbScript, args, { encoding: 'utf-8' });
      console.log(`Stdout >>${stdout}<<`);
    } catch (err) {
      console.log(`Stdout >>${stdout}<<`);
      console.log('Child error', err);
      res.status(422).json({ message: err.message });
      return;
    } finally {
      // cleanup of file and directory
      fsprom.rmdir(uploadDirectory, { recursive: true }).then(
        (result) => console.log('Successfully purged upload dir', result),
        (err) => { console.log('Error, could not remove directory', err); },
      );
    }

    res.json({ message: 'ok' });
  },
);

module.exports = router;
