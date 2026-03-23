# Magisterium MCP Server

An [MCP](https://modelcontextprotocol.io/) server that provides AI assistants with access to the [Magisterium API](https://www.magisterium.com/) for authoritative Catholic Church teaching with citations.

Exposes one tool — `magisterium_query` — that any MCP-compatible client (Claude Desktop, Claude Code, Cursor, etc.) can call.

## Prerequisites

- **Node.js 18+** (check with `node --version`)
- **Magisterium API key** from [magisterium.com](https://www.magisterium.com/)

## Setup

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

You should see output confirming the `magisterium_query` tool is available.

## Configuring MCP Clients

Copy `mcp-config.sample.json` and replace the path with your actual install location.

### Claude Desktop / Claude Code

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

### Cursor

Add to `.cursor/mcp.json` (workspace) or `~/.config/cursor/mcp.json` (global):

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

Then restart Cursor and enable the server under Settings > MCP Tools.

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

## Development

```bash
npm run build    # Compile TypeScript to dist/
npm run dev      # Watch mode — auto-rebuild on changes
npm start        # Run the MCP server
npm test         # Test server responds to MCP handshake
```

The source is `mcp-magisterium.ts`. After editing, run `npm run build` to recompile (or use `npm run dev` for auto-rebuild).

## Troubleshooting

**"Cannot find module" errors** — Run `npm install` then `npm run build`.

**"MAGISTERIUM_API_KEY environment variable is not set"** — Ensure `.env` exists in the project root with your API key. The `run-magisterium.sh` wrapper script `cd`s to the correct directory so dotenv can find it.

**Server works manually but not in MCP client** — Use the `run-magisterium.sh` wrapper script (not `node` directly). It ensures the working directory is correct regardless of how the client spawns the process.

**"0 tools enabled" in Cursor** — Fully quit and restart Cursor after adding the config. Check that the path in your config is correct and `run-magisterium.sh` is executable (`chmod +x run-magisterium.sh`).
