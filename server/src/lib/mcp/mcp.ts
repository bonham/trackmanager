import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router } from 'express';
import type { TrackInitData } from 'trackmanager-shared';
import { Track, TrackCollection } from 'trackmanager-shared';
import * as z from 'zod/v4';
import { getAllTracks, getTracksByIdList, pool } from '../../routes/tracks.js';
import getSchema from '../getSchema.js';

/**
 * Trackmanager MCP Server
 *
 * Exposes Trackmanager track data via the Model Context Protocol (MCP).
 *
 * Trackmanager is a multi-tenant GPS track management application built on
 * an Express 5 REST API with PostgreSQL + PostGIS for spatial data storage.
 * Data isolation is achieved through PostgreSQL schemas; each tenant is
 * identified by a Schema ID (SID). All tools are scoped to a tenant via
 * the `sid` parameter.
 *
 * See IMPLEMENTATION.md for a full description of the architecture.
 */

function createMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: 'trackmanager',
    version: '1.0.0',
    description: 'An MCP server for accessing a track archive containing bicycle trips with details like duration, distance, elevation gain, and performance metrics. ' +
      'Browse trips by name, time, and route information. ' +
      'Each query requires specifying which tenant account to access.Ask the user for the schema id ( sid ). No guessing.' +
      'Currently supports retrieving all archived tracks with their metadata. Aggregations or calculations of performance data should not be done ' +
      'instead talk about properties of a small sample of the tracks.'
  });

  // Schema for parsing year query results
  const YearRowSchema = z.object({
    year: z.number().int(),
  });

  // Schema for parsing track rows (id, name, time)
  const TrackBasicRowSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    time: z.date().nullable(),
  });

  /**
   * get_all_tracks
   *
   * Retrieve all GPS tracks for a given tenant schema with basic information,
   * ordered by most recent first. Returns id, name, and start date for each track.
   *
   * The `sid` (Schema ID) parameter identifies the tenant. It must be
   * alphanumeric and must exist in the Trackmanager database.
   */
  mcpServer.registerTool(
    'get_all_tracks',
    {
      title: 'Get All Tracks',
      description:
        'Retrieve all bicycle tracks from the archive with basic information (id, name, and start date), ' +
        'ordered by most recent first. ' +
        'Use this to browse available tracks or to build a set of track IDs for further queries.',
      inputSchema: {
        sid: z
          .string()
          .regex(/^[a-zA-Z0-9]+$/)
          .describe(
            'Schema identifier (SID) for the tenant. Must be alphanumeric. ' +
            'Identifies which PostgreSQL schema (tenant) to query.'
          ),
      },
    },
    async ({ sid }) => {
      const schema = await getSchema(sid, pool);
      if (schema === null) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Could not resolve schema for sid: ${sid}` }),
            },
          ],
          isError: true,
        };
      }

      let tracks: Record<string, unknown>[];
      try {
        const allTracks = await getAllTracks(schema);
        // Filter to only return id, name, and date
        tracks = allTracks.map((track) => ({
          id: track.id,
          name: track.name,
          date: track.time,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(tracks) }],
      };
    }
  );

  /**
   * get_track_aggregates
   *
   * Retrieve track metadata by ID list, create Track objects, aggregate them into a
   * TrackCollection, and return aggregated statistics: total distance, total ascent,
   * and total ride time.
   *
   * The `sid` (Schema ID) parameter identifies the tenant. It must be
   * alphanumeric and must exist in the Trackmanager database.
   */
  mcpServer.registerTool(
    'get_track_aggregates',
    {
      title: 'Get Track Aggregates',
      description:
        'Fetch track metadata by ID list and return aggregated statistics including total distance, ascent, and ride time. ' +
        'This is useful for analyzing performance metrics across a set of tracks. ' +
        'Provide a list of track IDs and the schema ID (sid) of the tenant.',
      inputSchema: {
        sid: z
          .string()
          .regex(/^[a-zA-Z0-9]+$/)
          .describe(
            'Schema identifier (SID) for the tenant. Must be alphanumeric. ' +
            'Identifies which PostgreSQL schema (tenant) to query.'
          ),
        trackIds: z
          .array(z.number().int().nonnegative())
          .min(1)
          .describe('Array of track IDs to aggregate statistics for.'),
      },
    },
    async ({ sid, trackIds }) => {
      const schema = await getSchema(sid, pool);
      if (schema === null) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Could not resolve schema for sid: ${sid}` }),
            },
          ],
          isError: true,
        };
      }

      let trackMetadata: Record<string, unknown>[];
      try {
        trackMetadata = await getTracksByIdList(schema, trackIds);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }

      try {
        // Create Track objects from metadata
        const tracks = trackMetadata.map(
          (metadata) => new Track(metadata as TrackInitData)
        );

        // Create TrackCollection and get aggregates
        const collection = new TrackCollection(tracks);

        const result = {
          trackCount: collection.members().length,
          totalDistance: collection.distance(),
          totalAscent: collection.ascent(),
          totalRideTime: collection.timeLength(),
          tracks: trackMetadata,
        };

        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: `Failed to process tracks: ${message}` }) }],
          isError: true,
        };
      }
    }
  );

  /**
   * get_all_years
   *
   * Retrieve all distinct years for which tracks exist in the archive,
   * ordered from most recent to oldest.
   *
   * The `sid` (Schema ID) parameter identifies the tenant. It must be
   * alphanumeric and must exist in the Trackmanager database.
   */
  mcpServer.registerTool(
    'get_all_years',
    {
      title: 'Get All Years',
      description:
        'Retrieve all years for which tracks exist in the archive, ordered from most recent to oldest. ' +
        'Use this to determine what time periods have track data available.',
      inputSchema: {
        sid: z
          .string()
          .regex(/^[a-zA-Z0-9]+$/)
          .describe(
            'Schema identifier (SID) for the tenant. Must be alphanumeric. ' +
            'Identifies which PostgreSQL schema (tenant) to query.'
          ),
      },
    },
    async ({ sid }) => {
      const schema = await getSchema(sid, pool);
      if (schema === null) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Could not resolve schema for sid: ${sid}` }),
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await pool.query(
          `SELECT DISTINCT EXTRACT(YEAR FROM time)::INTEGER as year FROM ${schema}.tracks WHERE time IS NOT NULL ORDER BY year DESC`
        );
        const years = z.array(YearRowSchema).parse(result.rows).map((row) => row.year);

        return {
          content: [{ type: 'text', text: JSON.stringify(years) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    }
  );

  /**
   * get_tracks_by_year
   *
   * Retrieve tracks for a specific year, ordered by most recent first.
   * Returns id, name, and start date for each track.
   *
   * The `sid` (Schema ID) parameter identifies the tenant. It must be
   * alphanumeric and must exist in the Trackmanager database.
   */
  mcpServer.registerTool(
    'get_tracks_by_year',
    {
      title: 'Get Tracks by Year',
      description:
        'Retrieve all tracks from a specific year, ordered by most recent first. ' +
        'Returns track id, name, and start date. Use this to narrow down tracks by year before requesting full metadata.',
      inputSchema: {
        sid: z
          .string()
          .regex(/^[a-zA-Z0-9]+$/)
          .describe(
            'Schema identifier (SID) for the tenant. Must be alphanumeric. ' +
            'Identifies which PostgreSQL schema (tenant) to query.'
          ),
        year: z
          .number()
          .int()
          .min(1900)
          .max(2999)
          .describe('The year for which to retrieve tracks (e.g., 2023, 2024).'),
      },
    },
    async ({ sid, year }) => {
      const schema = await getSchema(sid, pool);
      if (schema === null) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Could not resolve schema for sid: ${sid}` }),
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await pool.query(
          `SELECT id, name, time FROM ${schema}.tracks WHERE EXTRACT(YEAR FROM time) = $1 ORDER BY time DESC`,
          [year]
        );

        const parsedRows = z.array(TrackBasicRowSchema).parse(result.rows);
        const tracks = parsedRows.map((row) => ({
          id: row.id,
          name: row.name,
          date: row.time,
        }));

        return {
          content: [{ type: 'text', text: JSON.stringify(tracks) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    }
  );

  /**
   * get_track_metadata
   *
   * Retrieve full metadata for a specific list of tracks by their IDs.
   * Includes comprehensive information like distance, elevation gain, and ride time.
   *
   * The `sid` (Schema ID) parameter identifies the tenant. It must be
   * alphanumeric and must exist in the Trackmanager database.
   */
  mcpServer.registerTool(
    'get_track_metadata',
    {
      title: 'Get Track Metadata',
      description:
        'Retrieve full metadata for a specific list of tracks by their IDs. ' +
        'Returns comprehensive track information including distance, elevation gain, and ride time. ' +
        'Use this after building a set of track IDs from other queries.',
      inputSchema: {
        sid: z
          .string()
          .regex(/^[a-zA-Z0-9]+$/)
          .describe(
            'Schema identifier (SID) for the tenant. Must be alphanumeric. ' +
            'Identifies which PostgreSQL schema (tenant) to query.'
          ),
        trackIds: z
          .array(z.number().int().nonnegative())
          .min(1)
          .describe('Array of track IDs to retrieve full metadata for.'),
      },
    },
    async ({ sid, trackIds }) => {
      const schema = await getSchema(sid, pool);
      if (schema === null) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Could not resolve schema for sid: ${sid}` }),
            },
          ],
          isError: true,
        };
      }

      try {
        const trackMetadata = await getTracksByIdList(schema, trackIds);

        return {
          content: [{ type: 'text', text: JSON.stringify(trackMetadata) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
          isError: true,
        };
      }
    }
  );

  return mcpServer;
}

export interface McpRouterOptions {
  /** Return JSON responses instead of SSE streams. Useful for testing. Default: false */
  enableJsonResponse?: boolean;
}

export function createMcpRouter(options: McpRouterOptions = {}): Router {
  const router = Router();

  // Stateless: each request gets its own server + transport instance
  router.post('/', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
      enableJsonResponse: options.enableJsonResponse ?? false,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // SSE stream endpoint for server-sent events
  router.get('/', async (req, res) => {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('MCP SSE error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
}

export default createMcpRouter();
