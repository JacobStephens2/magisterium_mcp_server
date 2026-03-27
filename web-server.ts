#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';

dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 3458;

app.use(cors());
app.use(express.json());

// --- Shared Magisterium API call ---

interface MagisteriumResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  citations?: Array<{
    cited_text: string;
    cited_text_heading: string;
    document_title: string;
    document_author: string;
    document_reference: string;
    source_url: string;
  }>;
  related_questions?: string[];
}

async function callMagisteriumAPI(
  query: string,
  model: string = 'magisterium-1',
  returnRelatedQuestions: boolean = true,
): Promise<MagisteriumResponse> {
  const apiKey = process.env.MAGISTERIUM_API_KEY;
  if (!apiKey) throw new Error('MAGISTERIUM_API_KEY is not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: query }],
        return_related_questions: returnRelatedQuestions,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Magisterium API error (${response.status}): ${errorText}`);
    }

    return await response.json() as MagisteriumResponse;
  } finally {
    clearTimeout(timeout);
  }
}

// --- REST API endpoint (for the frontend) ---

interface MagisteriumRequest {
  query: string;
  model?: string;
  return_related_questions?: boolean;
}

app.post('/api/query', async (req: express.Request, res: express.Response) => {
  const { query, model, return_related_questions } = req.body as MagisteriumRequest;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'query parameter is required' });
    return;
  }

  try {
    const data = await callMagisteriumAPI(query, model, return_related_questions);
    res.json(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      res.status(504).json({ error: 'Request to Magisterium API timed out' });
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// --- MCP Streamable HTTP endpoint ---

function createMCPServer(): Server {
  const server = new Server(
    { name: 'magisterium-api', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'magisterium_query',
        description: 'Query the Magisterium API for authoritative Catholic Church teaching with citations from official documents',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The question or topic to ask about Catholic Church teaching',
            },
            model: {
              type: 'string',
              description: 'The model to use (default: magisterium-1)',
              default: 'magisterium-1',
            },
            return_related_questions: {
              type: 'boolean',
              description: 'Whether to return related questions (default: true)',
              default: true,
            },
          },
          required: ['query'],
        },
      } satisfies Tool,
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'magisterium_query') {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
        isError: true,
      };
    }

    const { query, model, return_related_questions } = request.params.arguments as {
      query: string;
      model?: string;
      return_related_questions?: boolean;
    };

    if (!query) {
      return {
        content: [{ type: 'text', text: 'Query parameter is required' }],
        isError: true,
      };
    }

    try {
      const result = await callMagisteriumAPI(query, model, return_related_questions);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Failed to query Magisterium API: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session — create server + transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  transport.onclose = () => {
    if (transport.sessionId) transports.delete(transport.sessionId);
  };

  const server = createMCPServer();
  await server.connect(transport);

  if (transport.sessionId) transports.set(transport.sessionId, transport);

  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }
  await transports.get(sessionId)!.handleRequest(req, res);
});

app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: 'Invalid or missing session ID' });
    return;
  }
  await transports.get(sessionId)!.handleRequest(req, res);
});

// --- Start ---

app.listen(PORT, () => {
  console.log(`Magisterium web API + MCP server listening on port ${PORT}`);
});
