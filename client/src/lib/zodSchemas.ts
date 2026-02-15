import * as z from 'zod'
import type { Track } from '@/lib/Track'
import type { MultiLineString } from 'geojson'

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

const GeoJsonObjectSchema = z.object({
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

// GeoJSON Properties and Feature schemas
export const GeoJsonPropertiesSchema = z.record(z.string(), z.any()).nullable();

export const FeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: GeometrySchema,
  id: z.union([z.string(), z.number()]).optional(),
  properties: GeoJsonPropertiesSchema,
  bbox: BBoxSchema.optional()
});

// extra .... to improve with FeatureSchema.refine(..)
export const MultiLineStringFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: MultiLineStringSchema,
  id: z.union([z.string(), z.number()]).optional(),
  properties: GeoJsonPropertiesSchema,
  bbox: BBoxSchema.optional()
});


export const FeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(FeatureSchema),
  bbox: BBoxSchema.optional()
});

// Type inference for Feature and FeatureCollection
export type GeoJsonProperties = z.infer<typeof GeoJsonPropertiesSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type MultiLineStringFeature = z.infer<typeof MultiLineStringFeatureSchema>;
export type FeatureCollection = z.infer<typeof FeatureCollectionSchema>;

const MultiLineStringWithTrackIdSchema = z.object({ id: z.number(), geojson: MultiLineStringSchema })
type MultiLineStringWithTrackId = z.infer<typeof MultiLineStringWithTrackIdSchema>

export { MultiLineStringWithTrackIdSchema, type MultiLineStringWithTrackId }

export interface MultiLineStringWithTrack { track: Track, geojson: MultiLineString }
