import * as dotenv from 'dotenv';
import type { Request as ExpressRequest, NextFunction, Response } from 'express';
import express from 'express';
import { Formidable } from 'formidable';
import { mkdtemp as mkdtempprom } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import pg from 'pg';
import { MultiLineStringWithTrackIdSchema, TrackIdListSchema, TrackMetadataSchema } from 'trackmanager-shared/zodSchemas';
import * as z from 'zod';
import { Track2DbWriter } from '../lib/Track2DbWriter.js';
import { DateStringMatcher, StringCleaner } from '../lib/analyzeString.js';
import { asyncWrapper } from '../lib/asyncMiddlewareWrapper.js';
import { processUpload } from '../lib/processUpload.js';
import createSidValidationChain from '../lib/sidResolverMiddleware.js';
import trackIdValidationMiddleware from '../lib/trackIdValidationMiddleware.js';
import yearValidation from '../lib/yearValidation.js';
import { isAuthenticated } from './auth/auth.js';

const { Pool } = pg;

const UPLOAD_DIR_PREFIX = 'trackmanager-upload-';
dotenv.config();
const TMP_BASE_DIR = process.env.UPLOAD_DIR ?? tmpdir();

const router = express.Router();
router.use(express.json()); // use builtin json body parser

const ReqValidateSchema = z.object({
  schema: z.string(),
});
const ReqValidateYear = z.object({
  params: z.object({
    year: z.string().min(1),
  }),
});
const ReqValidateSchemaTrack = z.object({
  schema: z.string().min(1),
  params: z.object({
    trackId: z.coerce.number().int(),
  }),
})

// Schemas for validating DB query results and request bodies
const TrackMetadataDbRowSchema = TrackMetadataSchema.extend({ time: z.date().nullable() })
const GeoJsonDbRowSchema = z.object({ id: z.number(), geojson: z.string() })
const SrcRowSchema = z.object({ src: z.string() })
const IdRowSchema = z.object({ id: z.number() })
const BBoxBodySchema = z.array(z.number()).length(4)
const UpdateBodySchema = z.object({
  updateAttributes: z.array(z.string()),
  data: z.record(z.string(), z.string()),
})

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
export { pool };
const sidValidationChain = createSidValidationChain(pool);

/**
 * getAllTracks - query all tracks for a given schema, ordered by time descending.
 * @param schema - Resolved PostgreSQL schema name
 * @returns Array of track metadata objects with id, name, length, src, time, timelength, ascent
 */
export async function getAllTracks(schema: string) {
  const queryResult = await pool.query(
    'select id, name, length, length_calc, src, '
    + 'time, timelength, timelength_calc, ascent, ascent_calc '
    + `from ${schema}.tracks order by time desc`,
  );
  return z.array(TrackMetadataDbRowSchema).parse(queryResult.rows);
}

/**
 * GET /getall/sid/:sid
 * Retrieve all tracks for a given schema.
 * @param sid - Schema identifier from session
 * @returns Array of track metadata objects with id, name, length, src, time, timelength, ascent
 */
router.get(
  '/getall/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = ReqValidateSchema.parse(req);
    try {
      const rows = await getAllTracks(schema);
      res.json(rows);
    } catch (err) {
      console.trace('Exception handling trace');
      console.log(err);
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }
  })
);

const IdsPayloadSchema = z.object({ ids: z.array(z.number().int()) });

/**
 * POST /geojson/sid/:sid
 * Retrieve GeoJSON geometry for a list of track IDs.
 * @param sid - Schema identifier from session
 * @param body - Array of track IDs: { ids: [1, 2, 3, ...] }
 * @returns Array of objects with id and geojson (GeoJsonObject)
 */
router.post(
  '/geojson/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = ReqValidateSchema.parse(req);
    try {

      const { ids } = IdsPayloadSchema.parse(req.body);

      // zero payload
      if (ids.length === 0) {
        res.json([]);
        return;
      }

      const inClause = `(${ids.join()})`;
      const query = 'select id, ST_AsGeoJSON(wkb_geometry,6,3) as geojson '
        + `from ${schema}.tracks where id in ${inClause}`;

      const queryResult = await pool.query(query);
      const rows = z.array(GeoJsonDbRowSchema).parse(queryResult.rows);

      const rowsWGeoJson = rows.map((x) => ({ id: x.id, geojson: JSON.parse(x.geojson) as unknown }));

      // Validate response against shared schema
      const validatedResponse = z.array(MultiLineStringWithTrackIdSchema).parse(rowsWGeoJson);
      res.json(validatedResponse);

    } catch (err: unknown) {
      console.trace('Exception handling trace');
      console.log(err);
      if (err instanceof Error && 'message' in err) res.status(500).send(err.message);
      else res.status(500);
    }
  })
);

/**
 * GET /byid/:trackId/sid/:sid
 * Retrieve metadata for a single track by ID.
 * @param trackId - Track identifier
 * @param sid - Schema identifier from session
 * @returns Track metadata object with id, name, length, src, time, timelength, ascent; 404 if not found
 */
router.get(
  '/byid/:trackId/sid/:sid',
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const validatedReq = ReqValidateSchemaTrack.parse(req);
    const { schema } = validatedReq;
    const { trackId } = validatedReq.params;

    const query = 'select id, name, length, length_calc, src, '
      + 'time, timelength, timelength_calc, ascent, ascent_calc '
      + `from ${schema}.tracks where id = '${trackId}'`;

    let rows: unknown[];
    try {
      const queryResult = await pool.query(query);
      rows = queryResult.rows;
      if (rows.length === 0) {
        res.status(404).end();
      } else {
        const row = TrackMetadataDbRowSchema.parse(rows[0]);
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

/**
 * POST /bylist/sid/:sid
 * Retrieve metadata for multiple tracks by their IDs.
 * @param sid - Schema identifier from session
 * @param body - Track ID list: [1, 2, 3, ...]
 * @returns Array of track metadata objects
 */
router.post(
  '/bylist/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = ReqValidateSchema.parse(req);

    // validate body. expect list of integers ( track ids )
    const body: unknown = req.body;

    let idList: number[];
    try {
      idList = TrackIdListSchema.parse(body);
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
      const { rows } = queryResult;

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

/**
 * GET /trackyears/sid/:sid
 * Retrieve all distinct years that have track data.
 * @param sid - Schema identifier from session
 * @returns Array of year strings (e.g. ['2020', '2021', '2022'])
 */
router.get(
  '/trackyears/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = ReqValidateSchema.parse(req);

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

/**
 * GET /ids/byyear/:year/sid/:sid
 * Retrieve track IDs for a specific year or tracks with null dates.
 * @param year - Year to query; use '0' for tracks with null dates
 * @param sid - Schema identifier from session
 * @returns Array of track IDs ordered by time descending
 */
router.get(
  '/ids/byyear/:year/sid/:sid',
  sidValidationChain,
  yearValidation,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const { schema } = ReqValidateSchema.parse(req);
    const { year } = ReqValidateYear.parse(req).params;

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

/**
 * POST /byextent/sid/:sid
 * Retrieve all tracks that intersect a geographic bounding box (EPSG:4326).
 * @param sid - Schema identifier from session
 * @param body - Bounding box coordinates: [minLon, minLat, maxLon, maxLat]
 * @returns Array of track metadata objects intersecting the bbox
 */
router.post(
  '/byextent/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    let query: string;
    try {
      const { schema } = ReqValidateSchema.parse(req);

      // get extent from payload
      const bbox = BBoxBodySchema.parse(req.body);

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

/**
 * POST /idlist/byextentbytime/sid/:sid
 * Retrieve track IDs intersecting a geographic bounding box, prioritized by time.
 * Tracks intersecting the bbox are returned first (ordered by time desc), followed by non-intersecting tracks.
 * @param sid - Schema identifier from session
 * @param body - Bounding box coordinates: [minLon, minLat, maxLon, maxLat]
 * @returns Array of track IDs ordered by intersection priority and time
 */
router.post(
  '/idlist/byextentbytime/sid/:sid',
  sidValidationChain,
  asyncWrapper(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    try {
      const { schema } = ReqValidateSchema.parse(req);

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
      const rows = z.array(IdRowSchema).parse(queryResult.rows);
      const validatedResult = TrackIdListSchema.parse(rows.map((r) => r.id));
      res.json(validatedResult);
    } catch (err) {
      next(err);
    }
  })
);

/**
 * PUT /byid/:trackId/sid/:sid
 * Update multiple attributes of a track (requires authentication).
 * @param trackId - Track identifier
 * @param sid - Schema identifier from session
 * @param body - { updateAttributes: string[], data: { [key]: value } }
 * @returns 200 OK on success; 404 if track not found; 500 on error
 */
router.put(
  '/byid/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const validatedReq = ReqValidateSchemaTrack.parse(req);
    const { schema } = validatedReq;
    const { trackId } = validatedReq.params;

    const { updateAttributes, data } = UpdateBodySchema.parse(req.body);
    // SQL injection here

    // filter out attributes not in data object
    const existingAttributes = updateAttributes.filter((x: string) => (!(data[x] === undefined)));

    // compose query
    const halfCoalesced = existingAttributes.map((x: string) => `${x} = '${data[x]}'`);
    const setExpression = halfCoalesced.join(',');

    const query = `update ${schema}.tracks set ${setExpression} where id = ${trackId}`;
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

/**
 * PATCH /namefromsrc/:trackId/sid/:sid
 * Update a track's name by parsing and cleaning its source filename (requires authentication).
 * Extracts date strings and format suffixes to generate a clean name.
 * @param trackId - Track identifier
 * @param sid - Schema identifier from session
 * @returns 204 No Content on success
 */
router.patch(
  '/namefromsrc/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const validatedReq = ReqValidateSchemaTrack.parse(req);
    const { schema } = validatedReq;
    const { trackId } = validatedReq.params;

    // get source file name from server
    const queryResult = await pool.query(
      `select src from ${schema}.tracks where id = $1`,
      [trackId]
    );
    if (queryResult.rowCount !== 1) { throw Error(`Got ${queryResult.rowCount} but expected 1`) }
    const { src } = SrcRowSchema.parse(queryResult.rows[0])

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

      await tdbw.updateMetaData(trackId, { name: cleanedFileName })
    } finally {
      tdbw.end()
    }
    res.status(204)
    res.end()
  })
)

/**
 * DELETE /byid/:trackId/sid/:sid
 * Delete a track and all its associated data (requires authentication).
 * Cascades delete to track_points and segments tables.
 * @param trackId - Track identifier
 * @param sid - Schema identifier from session
 * @returns 200 OK on success; 404 if track not found; 500 on error
 */
router.delete(
  '/byid/:trackId/sid/:sid',
  isAuthenticated,
  sidValidationChain,
  trackIdValidationMiddleware,
  asyncWrapper(async (req: ExpressRequest, res: Response) => {
    const validatedReq = ReqValidateSchemaTrack.parse(req);
    const { schema } = validatedReq;
    const { trackId } = validatedReq.params;

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

/**
 * POST /addtrack/sid/:sid
 * Upload and process a new track file (GPX or FIT format) (requires authentication).
 * Accepts multipart form-data with a 'newtrack' field containing the track file.
 * @param sid - Schema identifier from session
 * @param body - Multipart form with file field 'newtrack'
 * @returns { message: 'ok' } on success; { message: 'error', fileName } on failure
 */
router.post(
  '/addtrack/sid/:sid',
  isAuthenticated,
  sidValidationChain,

  asyncWrapper(async (req: ExpressRequest, res: Response, next: NextFunction) => {
    const { schema } = ReqValidateSchema.parse(req);

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

        processUpload(filePath, schema)
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
