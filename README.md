# Magisterium API Client

A TypeScript client for interfacing with the Magisterium API.

## Environment

Requires at least Node.js 12.20.0 given use of node-fetch (https://www.npmjs.com/package/node-fetch?activeTab=readme)


## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your API key:**
   Create a `.env` file in the project root and add your API key:
   ```
   MAGISTERIUM_API_KEY=your-actual-api-key-here
   ```

## Compiling TypeScript

You have several options to compile the TypeScript code:

### Method 1: Using tsconfig.json (Recommended)
```bash
npx tsc
```
This compiles the TypeScript files and outputs them to the `dist/` directory.

### Method 2: Direct compilation with options
```bash
npx tsc --target es2020 --module commonjs magisterium.ts
```
This creates `magisterium.js` in the current directory.

### Method 3: Simple compilation
```bash
npx tsc magisterium.ts
```
Uses default TypeScript settings and creates `magisterium.js` in the current directory.

## Running the Code

After compilation, you can run the code:

```bash
# If compiled with tsconfig.json (Method 1)
node dist/magisterium.js

# If compiled with Method 2 or 3
node magisterium.js
```

## MCP (Model Context Protocol) Tool

This project includes an MCP server that provides a `magisterium_query` tool for AI assistants to query the Magisterium API directly.

### Running the MCP Server

```bash
npm run mcp
```

### MCP Tool Usage

The MCP server provides a `magisterium_query` tool with the following parameters:

- **query** (required): The question or topic to ask about Catholic Church teaching
- **model** (optional): The model to use (default: "magisterium-1")
- **return_related_questions** (optional): Whether to return related questions (default: true)

### Example MCP Tool Call

```json
{
  "name": "magisterium_query",
  "arguments": {
    "query": "What does the Catholic Church teach about the Eucharist?",
    "model": "magisterium-1",
    "return_related_questions": true
  }
}
```

### Integrating with MCP Clients

To use this MCP server with compatible AI assistants:

1. **Claude Desktop**: Add the server configuration to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "magisterium": {
         "command": "node",
         "args": ["--loader", "ts-node/esm", "mcp-magisterium.ts"],
         "cwd": "/path/to/magisterium",
          "env": {
            "MAGISTERIUM_API_KEY": ""
          }
       }
     }
   }
   ```

2. **Other MCP Clients**: Use the provided `mcp-config.json` as a reference for configuration.

## API Usage

The code makes a direct API call to the Magisterium API:

```bash
curl -X POST https://www.magisterium.com/api/v1/chat/completions \
    -H "Authorization: Bearer $MAGISTERIUM_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
    "model": "magisterium-1",
    "messages": [
        {
        "role": "user",
        "content": "What is the Magisterium?"
        }
    ],
    "stream": True
    }'
```
