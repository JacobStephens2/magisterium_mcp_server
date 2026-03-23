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
        return {
          content: [{ type: 'text', text: `Unknown tool: ${request.params.name}` }],
          isError: true,
        };
      }

      const { query, model = 'magisterium-1', return_related_questions = true } = request.params.arguments as {
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
        const result = await this.callMagisteriumAPI(query, model, return_related_questions);

        return {
          content: [
            {
              type: 'text',
              text: this.formatResponse(result),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Failed to query Magisterium API: ${message}` }],
          isError: true,
        };
      }
    });
  }

  private formatResponse(result: MagisteriumResponse): string {
    const parts: string[] = [];

    const answer = result.choices?.[0]?.message?.content;
    if (answer) {
      parts.push(answer);
    }

    if (result.citations && result.citations.length > 0) {
      parts.push('\n---\n**Citations:**');
      for (const cite of result.citations) {
        const source = cite.source_url ? ` (${cite.source_url})` : '';
        parts.push(`- **${cite.document_title}** — ${cite.document_author}`);
        if (cite.document_reference) {
          parts.push(`  ${cite.document_reference}${source}`);
        }
        if (cite.cited_text_heading) {
          parts.push(`  Section: ${cite.cited_text_heading}`);
        }
      }
    }

    if (result.related_questions && result.related_questions.length > 0) {
      parts.push('\n**Related Questions:**');
      for (const q of result.related_questions) {
        parts.push(`- ${q}`);
      }
    }

    return parts.join('\n');
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
          messages: [
            {
              role: 'user',
              content: query,
            }
          ],
          return_related_questions: returnRelatedQuestions,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      return await response.json() as MagisteriumResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Magisterium MCP server running on stdio');
  }
}

const server = new MagisteriumMCPServer();
server.run().catch(console.error); 