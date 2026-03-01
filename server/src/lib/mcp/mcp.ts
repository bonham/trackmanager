import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router } from 'express';
import * as z from 'zod/v4';

const STORIES: Record<string, string> = {
  forest: `
Deep in the Whispering Forest, a small fox named Finn noticed that all the fireflies had gone dark.
He padded softly through the trees, his amber eyes searching the shadows.
An old owl named Mira perched on a mossy branch and whispered, "Something has taken their light."
Finn followed a trail of tiny silver footprints deeper into the woods.
The prints led to a hollow log sealed with a peculiar purple stone.
He sniffed the stone — it smelled of lavender and old rain.
When he nudged it aside, a warm golden glow spilled out like honey.
Inside sat a small creature no bigger than a chestnut, fast asleep.
It was a glow-keeper, a guardian of all forest light, who had curled up and forgotten to wake.
Finn gently touched its tiny shoulder and the creature yawned, stretching its golden fingers wide.
One by one the fireflies blinked back to life all across the forest.
The trees swayed as if sighing with relief, their leaves catching the soft yellow light.
Mira the owl ruffled her feathers and smiled knowingly.
Finn watched the fireflies dance and felt a deep, quiet warmth in his chest.
He turned and trotted home, his paws barely making a sound on the soft earth.
The glow-keeper waved a tiny glowing hand after him.
The forest hummed a low lullaby that drifted between the branches.
Every creature settled into their burrow, nest, or hollow, eyes growing heavy.
Finn curled into his den, the memory of the golden light still shining behind his eyes.
And just like that, the mystery of the dark fireflies was peacefully solved, and the forest slept.`.trim(),

  lighthouse: `
On a small island stood a lighthouse whose beam had flickered off three nights in a row.
A girl named Wren rowed her little boat across the calm black water to find out why.
She climbed the spiral staircase, her lantern casting long wobbly shadows on the stone walls.
At the top she found the great lamp cold and dark, but the logbook lay open on the keeper's desk.
The last entry read: "Heard singing from the rocks below. Went to see. Do not follow."
Wren pressed her ear to the cold glass and listened — and there it was, a faint silvery hum.
She climbed down the outside ladder to the wave-splashed rocks at the base.
There she found the lighthouse keeper, eyes closed, sitting perfectly still with a smile on his face.
Around him swirled a dozen pale-blue starfish, each one glowing faintly and humming a different note.
The keeper had been so enchanted by their song that he had simply forgotten everything else.
Wren clapped her hands twice and the starfish paused, turning their tiny eyes toward her.
"Thank you," she said politely, "but we need him back."
The starfish hummed one final chorus, then slipped quietly into the sea.
The keeper blinked, stretched, and looked around as though waking from the best dream of his life.
Together he and Wren climbed back up and lit the great lamp once more.
Its beam swept across the water, guiding ships safely through the dark.
The keeper poured two cups of warm chamomile tea and they sat listening to the waves.
Wren never told anyone what she had seen, and neither did the keeper.
But every night after that, very faint music could be heard rising from the rocks below.
And anyone who heard it found themselves yawning deeply and drifting off to the most peaceful sleep.`.trim(),
};

function tellStory(theme: 'forest' | 'lighthouse'): string {
  return STORIES[theme];
}

function createMcpServer(): McpServer {
  const mcpServer = new McpServer({
    name: 'bedtime-mystery-stories',
    version: '1.0.0'
  });

  mcpServer.registerTool(
    'tell_mystery_story',
    {
      title: 'Bedtime Mystery Story',
      description:
        'Tells a gentle 20-sentence mystery story for children at bedtime. ' +
        'Choose a theme: "forest" (a fox investigates missing fireflies) or ' +
        '"lighthouse" (a girl solves the mystery of a dark lighthouse).',
      inputSchema: {
        theme: z
          .enum(['forest', 'lighthouse'])
          .describe('The story theme to tell')
      }
    },
    ({ theme }) => {
      const story = tellStory(theme);
      return {
        content: [{ type: 'text', text: story }]
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
      enableJsonResponse: options.enableJsonResponse ?? false
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
      sessionIdGenerator: undefined // stateless mode
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
