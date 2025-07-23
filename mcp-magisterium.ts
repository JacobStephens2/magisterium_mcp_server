#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface MagisteriumResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
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
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

class MagisteriumMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'magisterium-api',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'magisterium_query',
            description: 'Send a query to the Magisterium API to get authoritative Catholic Church teaching responses with citations',
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
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'magisterium_query') {
        throw new Error(`Unknown tool: ${request.params.name}`);
      }

      const { query, model = 'magisterium-1', return_related_questions = true } = request.params.arguments as {
        query: string;
        model?: string;
        return_related_questions?: boolean;
      };

      if (!query) {
        throw new Error('Query parameter is required');
      }

      try {
        const result = await this.callMagisteriumAPI(query, model, return_related_questions);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Failed to query Magisterium API: ${error}`);
      }
    });
  }

  private async callMagisteriumAPI(
    query: string, 
    model: string, 
    returnRelatedQuestions: boolean
  ): Promise<MagisteriumResponse> {
    const apiKey = process.env.MAGISTERIUM_API_KEY;
    
    if (!apiKey) {
      throw new Error('MAGISTERIUM_API_KEY environment variable is not set');
    }

    const response = await fetch('https://www.magisterium.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: query,
          }
        ],
        return_related_questions: returnRelatedQuestions,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const results = await response.json() as MagisteriumResponse;
    return results;
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Magisterium MCP server running on stdio');
  }
}

const server = new MagisteriumMCPServer();
server.run().catch(console.error); 