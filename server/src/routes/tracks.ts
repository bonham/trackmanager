import type { Request as ExpressRequest, NextFunction, Response } from 'express';
import { Formidable } from 'formidable';
import { mkdtempSync } from 'node:fs';
import { rmdir as rmdirprom } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { isAuthenticated } from './auth/auth';

const UPLOAD_DIR_PREFIX = 'trackmanager-upload-';

interface Request extends ExpressRequest {
  schema: string
}

require('dotenv').config();

const TMP_BASE_DIR = process.env.UPLOAD_DIR || tmpdir();

const express = require('express');

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

const database = process.env.TM_DATABASE;
const gpx2dbScript = process.env.GPX2DBSCRIPT;

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
  async (req: Request, res: Response) => {
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
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }
  },
);

/// // Get Geojson for a list of ids. Payload { ids: [..] }
// result: { id: x.id, geojson: { .. } }
router.post(
  '/geojson/sid/:sid',
  sidValidationChain,
  async (req: Request, res: Response) => {
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
      const notIntegerList = _.reject(ids, (x: any) => (_.isInteger(x)));
      if (notIntegerList.length) throw Error('Found non integer elements in payload');

      const inClause = `(${ids.join()})`;
      const query = 'select id, ST_AsGeoJSON(wkb_geometry,6,3) as geojson '
        + `from ${schema}.tracks where id in ${inClause}`;

      const queryResult = await pool.query(query);
      const { rows } = queryResult;

      const rowsWGeoJson = _.map(rows, (x: any) => ({ id: x.id, geojson: JSON.parse(x.geojson) }));

      res.json(rowsWGeoJson);
    } catch (err: unknown) {
      console.trace('Exception handling trace');
      console.log(err);
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }
  },
);

/// // Get single track id
router.get(
  '/byid/:trackId/sid/:sid',
  sidValidationChain,
  trackIdValidationMiddleware,
  async (req: Request, res: Response) => {
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
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
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
  async (req: Request, res: Response) => {
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
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }
  },
);

/// // Get list of tracks by bounding box ( coordinates in EPSG:4326 )
router.post(
  '/byextent/sid/:sid',
  sidValidationChain,
  async (req: Request, res: Response, next: NextFunction) => {
    let query;
    try {
      const { schema } = req;

      // get extent from payload
      const bbox = req.body;
      if (!Array.isArray(bbox)) { throw Error('Payload is not array'); }
      if (bbox.length !== 4) { throw Error('BBox must have array length 4'); }

      const allAreNumbers = bbox.every((value) => (typeof value === 'number'));
      if (!allAreNumbers) { throw Error('Not all elements of bbox are numbers'); }

      const whereClause = 'ST_Intersects(wkb_geometry, ST_MakeEnvelope('
        + `${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, '4326'))`;


      query = 'select id, name, length, src,'
        + 'time, timelength, ascent '
        + `from ${schema}.tracks where ${whereClause}`;
      console.log(query);
    } catch (e) {
      next(e);
    }
    try {
      const queryResult = await pool.query(query);
      res.json(queryResult.rows);
    } catch (err) {
      next(err);
    }
  },
);

/// // Update single track
router.put(
  '/byid/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  async (req: Request, res: Response) => {
    const { schema } = req;
    const { updateAttributes } = req.body;
    const { data } = req.body;

    // filter out attributes not in data object
    const existingAttributes = updateAttributes.filter((x: any) => (!(data[x] === undefined)));

    // compose query
    const halfCoalesced = existingAttributes.map((x: any) => `${x} = '${data[x]}'`);
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
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  async (req: Request, res: Response) => {
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
async function processFile(filePath: string, uploadDir: string, schema: string): Promise<void> {
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
    const message = (err instanceof Error && 'message' in err) ? err.message : '';
    console.log('Message', message);
    throw (err);
  } finally {
    // cleanup of file and directory
    rmdirprom(uploadDir, { recursive: true }).then(
      () => console.log(`Successfully purged upload directory: ${uploadDir}`),
      (err: any) => { console.log('Error, could not upload file', err); },
    );
  }
}

// POST route for handling gpx track file uploads.
router.post(
  '/addtrack/sid/:sid',
  isAuthenticated,
  sidValidationChain,

  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uploadDir = mkdtempSync(join(TMP_BASE_DIR, UPLOAD_DIR_PREFIX));
      const form = new Formidable({
        uploadDir,
        filename: (name, ext, part) => {
          console.log('name', name, 'ext', ext);
          if (part.originalFilename) {
            return part.originalFilename;
          }
          throw Error('Unexpected: Part does not have property originalfilename');
        },
      });
      form.parse(req, async (err, fields, files) => {
        if (err) {
          next(err);
          return;
        }
        if (files.newtrack === undefined) throw new Error('Expected form field not received: newtrack');
        const filePath = files.newtrack[0].filepath;

        await processFile(filePath, uploadDir, req.schema);
        res.json({ message: 'ok' });
      });
    } catch (error) {
      next(error);
    }
  },
);


export default router;
