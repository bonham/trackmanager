import * as dotenv from 'dotenv';
import type { Request as ExpressRequest, NextFunction, Response } from 'express';
import express from 'express';
import { Formidable } from 'formidable';
import _ from 'lodash';
import { mkdtemp as mkdtempprom } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pkg from 'pg';
import { asyncWrapper } from '../lib/asyncMiddlewareWrapper.js';
import { processFile } from '../lib/processUpload.js';

const { Pool } = pkg;



import { isAuthenticated } from './auth/auth.js';

const UPLOAD_DIR_PREFIX = 'trackmanager-upload-';

type ReqWSchema = ExpressRequest & {
  schema: string
}

dotenv.config();

const TMP_BASE_DIR = process.env.UPLOAD_DIR ?? tmpdir();



const router = express.Router();
router.use(express.json()); // use builtin json body parser

import createSidValidationChain from '../lib/sidResolverMiddleware.js';
import trackIdValidationMiddleware from '../lib/trackIdValidationMiddleware.js';
import yearValidation from '../lib/yearValidation.js';

const SIMPLIFY_DISTANCE = 2;

const database = process.env.TM_DATABASE;

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
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema
    try {
      const queryResult = await pool.query(
        'select id, name, length, src, '
        + 'time, timelength, ascent '
        + `from ${schema}.tracks order by time desc`,
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
  })
);

/// // Get Geojson for a list of ids. Payload { ids: [..] }
// result: { id: x.id, geojson: { .. } }
function isIdsNumberArray(obj: any): obj is { ids: number[] } {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return obj && Array.isArray(obj.ids) && obj.ids.every((item: any) => typeof item === 'number');
}
router.post(
  '/geojson/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema
    try {

      if (!isIdsNumberArray(req.body)) {
        throw Error("Wrong type for req.body")
      } else {
        // validate expected property
        const { ids } = req.body

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
      }
    } catch (err: unknown) {
      console.trace('Exception handling trace');
      console.log(err);
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }
  })
);

/// // Get single track id
router.get(
  '/byid/:trackId/sid/:sid',
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema
    const { trackId } = req.params;

    const query = 'select id, name, length, src,'
      + 'time, timelength, ascent '
      + `from ${schema}.tracks where id = '${trackId}'`;

    let rows;
    try {
      const queryResult = await pool.query(query);
      rows = queryResult.rows;
      if (rows.length === 0) {
        res.status(404).end();
      } else {
        const row = rows[0];
        res.json(row);
      }

    } catch (err) {
      console.trace('Exception handling trace');
      console.error(err);
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }

  })
);

/// // Get list of tracks by year
router.get(
  '/byyear/:year/sid/:sid',
  sidValidationChain,
  yearValidation,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema;
    const { year } = req.params;

    let whereClause;
    if (year === '0') {
      whereClause = 'time is null';
    } else {
      whereClause = `extract(YEAR from time) = ${year}`;
    }

    const query = 'select id, name, length, src,'
      + 'time, timelength, ascent '
      + `from ${schema}.tracks where ${whereClause} order by time desc`;
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
  })
);

/// // Get list of tracks by bounding box ( coordinates in EPSG:4326 )
router.post(
  '/byextent/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    let query: string;
    try {
      const { schema } = req as ReqWSchema;

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

      const queryResult = await pool.query(query);
      res.json(queryResult.rows);
    } catch (err) {
      next(err);
    }
  })
);

/// // Update single track
router.put(
  '/byid/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema;
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
  }),
);

/// // Delete single track
router.delete(
  '/byid/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema;
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
  }),
);


// POST route for handling gpx track file uploads.
router.post(
  '/addtrack/sid/:sid',
  isAuthenticated,
  sidValidationChain,

  asyncWrapper(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const uploadDir = await mkdtempprom(join(TMP_BASE_DIR, UPLOAD_DIR_PREFIX));
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
    form.parse(req, (err, fields, files) => {
      if (err) {

        next(err);
        return;

      } else {

        if (files.newtrack === undefined) throw new Error('Expected form field not received: newtrack');
        const filePath = files.newtrack[0].filepath;

        processFile(filePath, (req as ReqWSchema).schema, SIMPLIFY_DISTANCE)
          .then(() => res.json({ message: 'ok' }))
          .catch(e => { throw e });
      }
    });
  }),
);


export default router;
