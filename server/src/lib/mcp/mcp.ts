import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router } from 'express';
import * as z from 'zod/v4';
import { getAllTracks, pool } from '../../routes/tracks.js';
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

  /**
   * get_all_tracks
   *
   * Retrieve all GPS tracks for a given tenant schema, ordered by time
   * descending. Each track record contains:
   *   id, name, length, length_calc, src, time, timelength,
   *   timelength_calc, ascent, ascent_calc
   *
   * The `sid` (Schema ID) parameter identifies the tenant. It must be
   * alphanumeric and must exist in the Trackmanager database.
   * Equivalent REST endpoint: GET /api/tracks/getall/sid/:sid
   */
  mcpServer.registerTool(
    'get_all_tracks',
    {
      title: 'Get All Tracks',
      description:
        'Retrieve  bicycle tracks / trips from the track archive, ordered by time descending. ' +
        'Returns a JSON array of track metadata objects, each with fields: ' +
        'id, name, length, length_calc, src, time, timelength, timelength_calc, ascent, ascent_calc. ' +
        'The sid parameter is the Schema ID that identifies the tenant. The user must provide it, no guessing. ' +
        'Use this tool to get an overview of the tracks in the archive. ' +
        'For detailed analysis, ask about specific track properties or a small sample of tracks instead of retrieving the entire archive.',
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
        tracks = await getAllTracks(schema);
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
