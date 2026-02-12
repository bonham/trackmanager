import * as z from 'zod'
import type { Track } from '@/lib/Track'

//import type { GeoJsonObject } from 'geojson'
//export type { GeoJsonObject }

export const BBoxSchema = z.union([
  z.tuple([z.number(), z.number(), z.number(), z.number()]),
  z.tuple([z.number(), z.number(), z.number(), z.number(), z.number(), z.number()])
]);

export const PositionSchema = z.array(z.number());

export const GeoJsonTypesSchema = z.enum([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
  'Feature',
  'FeatureCollection'
]);

export const GeoJsonObjectSchema = z.object({
  type: GeoJsonTypesSchema,
  bbox: BBoxSchema.optional()
});

// Geometry schemas
export const PointSchema = GeoJsonObjectSchema.extend({
  type: z.literal('Point'),
  coordinates: PositionSchema
});

export const MultiPointSchema = GeoJsonObjectSchema.extend({
  type: z.literal('MultiPoint'),
  coordinates: z.array(PositionSchema)
});

export const LineStringSchema = GeoJsonObjectSchema.extend({
  type: z.literal('LineString'),
  coordinates: z.array(PositionSchema)
});

export const MultiLineStringSchema = GeoJsonObjectSchema.extend({
  type: z.literal('MultiLineString'),
  coordinates: z.array(z.array(PositionSchema))
});

export const PolygonSchema = GeoJsonObjectSchema.extend({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(PositionSchema))
});

export const MultiPolygonSchema = GeoJsonObjectSchema.extend({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(PositionSchema)))
});

export const GeometrySchema = z.union([
  PointSchema,
  MultiPointSchema,
  LineStringSchema,
  MultiLineStringSchema,
  PolygonSchema,
  MultiPolygonSchema
]);

export type GeoJsonObject = z.infer<typeof GeoJsonObjectSchema>


const GeoJSONWithTrackIdSchema = z.object({ id: z.number(), geojson: z.union([MultiLineStringSchema, LineStringSchema]) })
type GeoJSONWithTrackId = z.infer<typeof GeoJSONWithTrackIdSchema>

export { GeoJSONWithTrackIdSchema, type GeoJSONWithTrackId }

export interface GeoJsonWithTrack { track: Track, geojson: GeoJsonObject }
