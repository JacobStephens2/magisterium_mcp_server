#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
class MagisteriumMCPServer {
    constructor() {
        this.server = new index_js_1.Server({
            name: 'magisterium-api',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
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
                    },
                ],
            };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'magisterium_query') {
                throw new Error(`Unknown tool: ${request.params.name}`);
            }
            const { query, model = 'magisterium-1', return_related_questions = true } = request.params.arguments;
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
            }
            catch (error) {
                throw new Error(`Failed to query Magisterium API: ${error}`);
            }
        });
    }
    async callMagisteriumAPI(query, model, returnRelatedQuestions) {
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
        const results = await response.json();
        return results;
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('Magisterium MCP server running on stdio');
    }
}
const server = new MagisteriumMCPServer();
server.run().catch(console.error);
