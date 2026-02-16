import * as dotenv from 'dotenv';
import type { Request as ExpressRequest, NextFunction, Response } from 'express';
import express from 'express';
import { Formidable } from 'formidable';
import type { GeoJsonObject } from 'geojson';
import _ from 'lodash';
import { mkdtemp as mkdtempprom } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import pg from 'pg';
import { MultiLineStringWithTrackIdSchema } from 'trackmanager-shared/zodSchemas';
import * as z from 'zod';
import { Track2DbWriter } from '../lib/Track2DbWriter.js';
import { DateStringMatcher, StringCleaner } from '../lib/analyzeString.js';
import { asyncWrapper } from '../lib/asyncMiddlewareWrapper.js';
import { processUpload } from '../lib/processUpload.js';
import createSidValidationChain from '../lib/sidResolverMiddleware.js';
import trackIdValidationMiddleware from '../lib/trackIdValidationMiddleware.js';
import yearValidation from '../lib/yearValidation.js';


const { Pool } = pg;



import { isAuthenticated } from './auth/auth.js';

const UPLOAD_DIR_PREFIX = 'trackmanager-upload-';

type ReqWSchema = ExpressRequest & {
  schema: string
}

dotenv.config();

const TMP_BASE_DIR = process.env.UPLOAD_DIR ?? tmpdir();



const router = express.Router();
router.use(express.json()); // use builtin json body parser


const database = process.env.TM_DATABASE;
if (database === undefined) {
  throw Error("Please define database in environment")
}

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
        'select id, name, length, length_calc, src, '
        + 'time, timelength, timelength_calc, ascent, ascent_calc '
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

// result: { id: x.id, geojson: { .. } }
function isIdsNumberArray(obj: unknown): obj is { ids: number[] } {


  if (
    obj &&
    typeof obj === 'object' &&
    'ids' in obj &&
    Array.isArray(obj.ids) &&
    obj.ids.every((item: unknown) => typeof item === 'number')
  ) return true
  else {
    return false
  }
}

/// // Get Geojson for a list of ids. Payload { ids: [..] }
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
        const notIntegerList = _.reject(ids, (x) => (_.isInteger(x)));
        if (notIntegerList.length) throw Error('Found non integer elements in payload');

        const inClause = `(${ids.join()})`;
        const query = 'select id, ST_AsGeoJSON(wkb_geometry,6,3) as geojson '
          + `from ${schema}.tracks where id in ${inClause}`;

        const queryResult = await pool.query(query);
        const { rows } = queryResult as { rows: { id: number, geojson: string }[] };

        const rowsWGeoJson = _.map(rows, (x) => ({ id: x.id, geojson: JSON.parse(x.geojson) as GeoJsonObject }));

        // Validate response against shared schema
        const validatedResponse = z.array(MultiLineStringWithTrackIdSchema).parse(rowsWGeoJson);
        res.json(validatedResponse);
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

    const query = 'select id, name, length, length_calc, src, '
      + 'time, timelength, timelength_calc, ascent, ascent_calc '
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

/// // Get track metadata objects for list of tracks
router.post(
  '/bylist/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema

    // validate body. expect list of integers ( track ids )
    const body = req.body;

    let idList: number[];
    try {
      idList = z.array(z.number().int().nonnegative()).parse(body);
    } catch (e) {
      console.error('Error parsing track id list', e);
      console.error('Received body:', body);
      res.status(400).send('Bad request: Could not parse body as list of track ids');
      return;
    }

    // empty list shortcut
    if (idList.length === 0) {
      res.json([]);
      return;
    }

    // compose query
    const inClause = `(${idList.join(',')})`;

    const query = 'select id, name, length, length_calc, src, '
      + 'time, timelength, timelength_calc, ascent, ascent_calc '
      + `from ${schema}.tracks where id in ${inClause}`;

    try {
      const queryResult = await pool.query(query);
      const qResult = queryResult.rows;
      const rows = z.array(z.object({
        id: z.number().int().nonnegative(),
        name: z.string().nullable(),
        length: z.number().nullable(),
        src: z.string().nullable(),
        time: z.date().nullable(),
        ascent: z.number().nullable()
      })).parse(qResult);

      if (rows.length === 0) {
        res.json([]);
      } else {
        res.json(rows);
      }

    } catch (err) {
      console.trace('Exception handling trace');
      console.error(err);
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }

  })
);

// Get years for existing tracks
router.get(
  '/trackyears/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema

    const query = "select distinct to_char(time, 'YYYY') as year "
      + `from ${schema}.tracks`;

    const SQLResult = z.array(z.object({ year: z.string() }));
    try {
      const queryResult = await pool.query(query);
      const tmpResult = queryResult.rows as unknown; // [ [5], [7], [9], ...]

      const rows = SQLResult.parse(tmpResult);
      res.json(rows.map((r) => r.year));

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
  '/ids/byyear/:year/sid/:sid',
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

    const query = 'select id '
      + `from ${schema}.tracks where ${whereClause} order by time desc`;
    try {

      const queryResult = await pool.query(query);
      const rowsUnknown = queryResult.rows as unknown
      const rows = z.array(z.object({ id: z.number() })).parse(rowsUnknown)
      res.json(rows.map((e) => e.id));

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
      const bbox = req.body as unknown;
      if (!Array.isArray(bbox)) { throw Error('Payload is not array'); }
      if (bbox.length !== 4) { throw Error('BBox must have array length 4'); }

      const allAreNumbers = bbox.every((value) => (typeof value === 'number'));
      if (!allAreNumbers) { throw Error('Not all elements of bbox are numbers'); }

      const whereClause = 'ST_Intersects(wkb_geometry, ST_MakeEnvelope('
        + `${bbox[0]}, ${bbox[1]}, ${bbox[2]}, ${bbox[3]}, '4326'))`;


      query = 'select id, name, length, length_calc, src, '
        + 'time, timelength, timelength_calc, ascent, ascent_calc '
        + `from ${schema}.tracks where ${whereClause}`;
      console.log(query);

      const queryResult = await pool.query(query);
      res.json(queryResult.rows);
    } catch (err) {
      next(err);
    }
  })
);

/// // Get list of track ids by extent (bounding box) and time 
// This is to have a priority for fetching in batches
router.post(
  '/idlist/byextentbytime/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { schema } = req as ReqWSchema;

      // get extent from payload
      let bbox: number[]
      try {
        bbox = z.array(z.number()).length(4).parse(req.body);
      } catch (e) {
        console.error('Error parsing bounding box from payload', e);
        console.error('Payload for bounding box is not array of 4 numbers');
        next(e);
        return;
      }

      const query =
      {
        name: 'Get track ids by extent and time',
        text: `
      with g as (
        select
        id,
        time,
        case when
          ST_Intersects(wkb_geometry, ST_MakeEnvelope($1,$2,$3,$4, '4326'))
          then 1
          else 2
        end as intersects
        from ${schema}.tracks  
        )
        select id from g order by intersects asc , time desc
      `,
        values: bbox,
      }
      const queryResult = await pool.query(query);
      const validatedResult = z.array(z.object({ id: z.number().int() })).parse(queryResult.rows);
      const idList = validatedResult.map((r) => r.id);
      res.json(idList);
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
    // SQL injection here

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

/// // Update name from source for a track
router.patch(
  '/namefromsrc/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = req as ReqWSchema;
    const tidS: string = req.params.trackId
    const tid = parseInt(tidS)

    // get source file name from server
    const queryResult = await pool.query(
      `select src from ${schema}.tracks where id = $1`,
      [tid]
    );
    if (queryResult.rowCount !== 1) { throw Error(`Got ${queryResult.rowCount} but expected 1`) }
    const { src } = queryResult.rows[0] as { src: string }

    // convert and write
    const tdbw = new Track2DbWriter()
    await tdbw.init({
      dbHost: poolOptions.host,
      dbName: poolOptions.database,
      dbSchema: schema,
      dbUser: poolOptions.user
    })
    try {
      const dateStrMatch = new DateStringMatcher(src)
      const fileNameWithoutDate = dateStrMatch.strippedString()

      const cleaner = new StringCleaner(fileNameWithoutDate)
      const cleanedFileName = cleaner.applyAll({ suffixList: ['gpx', 'fit'] })

      await tdbw.updateMetaData(tid, { name: cleanedFileName })
    } finally {
      tdbw.end()
    }
    res.status(204)
    res.end()
  })
)

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
        // console.log('name', name, 'ext', ext);
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
        const fileName = basename(filePath);

        processUpload(filePath, (req as ReqWSchema).schema)
          .then(() => res.json({ message: 'ok' }))
          .catch(e => {
            console.log(`Could not write ${fileName}`, e)
            res.status(500).json({ message: 'error', fileName })
          });
      }
    });
  }),
);

export default router;
