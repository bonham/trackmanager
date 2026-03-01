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
          name: 'bedtime-mystery-stories',
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
            name: 'tell_mystery_story',
            description: expect.stringContaining('mystery')
          })
        ])
      }
    });
  });

  test('tools/list includes tell_mystery_story with theme inputSchema', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send(TOOLS_LIST_REQUEST)
      .expect(200);

    const tools: Array<{ name: string; inputSchema: { properties?: Record<string, unknown> } }> =
      response.body.result.tools;
    const storyTool = tools.find(t => t.name === 'tell_mystery_story');

    expect(storyTool).toBeDefined();
    expect(storyTool?.inputSchema).toMatchObject({
      properties: {
        theme: expect.any(Object)
      }
    });
  });

  test('tell_mystery_story returns a 20-sentence forest story', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'tell_mystery_story', arguments: { theme: 'forest' } }
      })
      .expect(200);

    const text: string = response.body.result.content[0].text;
    const sentences = text.split('\n').filter((s: string) => s.trim().length > 0);
    expect(sentences).toHaveLength(20);
    expect(text).toContain('Finn');
  });

  test('tell_mystery_story returns a 20-sentence lighthouse story', async () => {
    const response = await request(app)
      .post('/api/mcp')
      .set('Content-Type', 'application/json')
      .set('Accept', MCP_ACCEPT)
      .send({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: { name: 'tell_mystery_story', arguments: { theme: 'lighthouse' } }
      })
      .expect(200);

    const text: string = response.body.result.content[0].text;
    const sentences = text.split('\n').filter((s: string) => s.trim().length > 0);
    expect(sentences).toHaveLength(20);
    expect(text).toContain('Wren');
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
