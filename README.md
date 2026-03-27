# Magisterium MCP Server

An [MCP](https://modelcontextprotocol.io/) server that provides AI assistants with access to the [Magisterium API](https://www.magisterium.com/) for authoritative Catholic Church teaching with citations.

Exposes one tool — `magisterium_query` — that any MCP-compatible client (Claude Desktop, Claude Code, Cursor, etc.) can call.

## Remote MCP Endpoint

The server is hosted at **https://magisterium.stephens.page/mcp** — no local install required.

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "magisterium": {
      "type": "url",
      "url": "https://magisterium.stephens.page/mcp"
    }
  }
}
```

### OpenClaw

Add to `~/.openclaw/openclaw.json`. OpenClaw's URL-based transport is in the schema but not yet fully supported at runtime ([#55087](https://github.com/openclaw/openclaw/issues/55087)), so use the stdio transport with a local install for now:

```json5
{
  mcp: {
    servers: {
      "magisterium": {
        command: "/bin/bash",
        args: ["/path/to/magisterium_mcp_server/run-magisterium.sh"],
      },
    },
  },
}
```

Once OpenClaw ships native HTTP MCP support, you can switch to the remote endpoint:

```json5
{
  mcp: {
    servers: {
      "magisterium": {
        url: "https://magisterium.stephens.page/mcp",
      },
    },
  },
}
```

See the [Local Setup](#local-setup-optional) section below for install instructions.

### Claude Desktop / Cursor / Other MCP Clients

Use the Streamable HTTP URL `https://magisterium.stephens.page/mcp` in your client's MCP configuration. Refer to your client's docs for the exact format.

## Local Setup (Optional)

If you prefer to run the server locally via stdio:

### Prerequisites

- **Node.js 18+** (check with `node --version`)
- **Magisterium API key** from [magisterium.com](https://www.magisterium.com/)

### Install

```bash
git clone https://github.com/JacobStephens2/magisterium_mcp_server.git
cd magisterium_mcp_server
npm install
npm run build
```

Create a `.env` file with your API key (see `.env.example`):

```
MAGISTERIUM_API_KEY=sk_your_key_here
```

Verify it works:

```bash
npm test
```

### Configuring MCP Clients for Local Use

Add to your MCP config (`claude_desktop_config.json` for Desktop, `~/.claude/settings.json` for Claude Code):

```json
{
  "mcpServers": {
    "magisterium": {
      "command": "/bin/bash",
      "args": ["/path/to/magisterium_mcp_server/run-magisterium.sh"]
    }
  }
}
```

## Tool: `magisterium_query`

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | string | yes | — | Question about Catholic Church teaching |
| `model` | string | no | `magisterium-1` | Model to use |
| `return_related_questions` | boolean | no | `true` | Include related questions in response |

### Example

```json
{
  "name": "magisterium_query",
  "arguments": {
    "query": "What does the Catholic Church teach about the Eucharist?"
  }
}
```

The response includes the formatted teaching text, citations with document titles and authors, and optionally related follow-up questions.

## Architecture

The server runs as a single Express process serving three endpoints:

- **`/`** — Static frontend
- **`/api/query`** — REST API for the frontend
- **`/mcp`** — Streamable HTTP MCP endpoint for AI agents

Apache reverse-proxies `/api` and `/mcp` to the Node.js backend; TLS is terminated at the edge via Let's Encrypt.

## Development

```bash
npm run build    # Compile TypeScript to dist/
npm run dev      # Watch mode — auto-rebuild on changes
npm start        # Run the stdio MCP server
npm run web      # Run the web server (REST API + MCP endpoint)
npm test         # Test server responds to MCP handshake
```

The main source files are `web-server.ts` (Express server with REST + MCP endpoints) and `mcp-magisterium.ts` (stdio MCP server). After editing, run `npm run build` to recompile.

## Troubleshooting

**"Cannot find module" errors** — Run `npm install` then `npm run build`.

**"MAGISTERIUM_API_KEY environment variable is not set"** — Ensure `.env` exists in the project root with your API key. The `run-magisterium.sh` wrapper script `cd`s to the correct directory so dotenv can find it.

**Server works manually but not in MCP client** — Use the `run-magisterium.sh` wrapper script (not `node` directly). It ensures the working directory is correct regardless of how the client spawns the process.

**"0 tools enabled" in Cursor** — Fully quit and restart Cursor after adding the config. Check that the path in your config is correct and `run-magisterium.sh` is executable (`chmod +x run-magisterium.sh`).
