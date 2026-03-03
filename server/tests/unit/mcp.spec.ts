import express from 'express';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import { createMcpRouter } from '../../src/lib/mcp/mcp.js';

// Minimal app - no pg, session or auth needed
const app = express();
app.use(express.json());
app.use('/api/mcp', createMcpRouter({ enableJsonResponse: true }));

const INIT_REQUEST = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' }
  }
};

const TOOLS_LIST_REQUEST = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {}
};

// MCP protocol requires Accept: application/json, text/event-stream on POST
const MCP_ACCEPT = 'application/json, text/event-stream';

describe('POST /api/mcp', () => {
  test('returns 200 for MCP initialize request', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send(INIT_REQUEST)
      .expect(200);

    expect(response.body).toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        protocolVersion: expect.any(String),
        serverInfo: {
          name: 'trackmanager',
          version: '1.0.0'
        },
        capabilities: expect.any(Object)
      }
    });
  });

  test('returns 200 for tools/list request', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send(TOOLS_LIST_REQUEST)
      .expect(200);

    expect(response.body).toMatchObject({
      jsonrpc: '2.0',
      id: 2,
      result: {
        tools: expect.arrayContaining([
          expect.objectContaining({
            name: 'get_all_tracks',
            description: expect.stringContaining('tracks')
          })
        ])
      }
    });
  });

  test('tools/list includes get_all_tracks with sid inputSchema', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send(TOOLS_LIST_REQUEST)
      .expect(200);

    const tools: Array<{ name: string; inputSchema: { properties?: Record<string, unknown> } }> =
      response.body.result.tools;
    const tracksTool = tools.find(t => t.name === 'get_all_tracks');

    expect(tracksTool).toBeDefined();
    expect(tracksTool?.inputSchema).toMatchObject({
      properties: {
        sid: expect.any(Object)
      }
    });
  });

  test('get_all_tracks returns isError when sid cannot be resolved (no DB)', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'get_all_tracks', arguments: { sid: 'testschema' } }
      })
      .expect(200);

    // Without a real DB the schema lookup fails; the tool should return isError
    expect(response.body.result.isError).toBe(true);
    const parsed: unknown = JSON.parse(response.body.result.content[0].text as string);
    expect(parsed).toMatchObject({ error: expect.any(String) });
  });

  test('get_all_tracks returns no successful result for invalid (non-alphanumeric) sid', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'get_all_tracks', arguments: { sid: 'bad sid!' } }
      })
      .expect(200);

    // Invalid sid fails Zod validation; the response should not contain track data
    const result = response.body.result as { isError?: boolean; content?: unknown[] } | undefined;
    const hasTrackData = result && !result.isError && Array.isArray(result.content);
    expect(hasTrackData).toBe(false);
  });

  test('returns JSON-RPC error for unknown method', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send({
        jsonrpc: '2.0',
        id: 3,
        method: 'unknown/method',
        params: {}
      })
      .expect(200);

    expect(response.body).toMatchObject({
      jsonrpc: '2.0',
      id: 3,
      error: {
        code: expect.any(Number),
        message: expect.any(String)
      }
    });
  });

  test('returns 406 when Accept header is missing text/event-stream', async () => {
    await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .send(INIT_REQUEST)
      .expect(406);
  });
});

describe('GET /api/mcp', () => {
  test('returns 406 when Accept header is missing text/event-stream', async () => {
    await request(app)
      .get('/api/mcp')
      .set('Accept', 'application/json')
      .expect(406);
  });
});

