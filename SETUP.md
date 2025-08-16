# Magisterium MCP Server Setup Guide

## Installation Complete ✅

The Magisterium MCP server has been successfully installed at `/var/www/magisterium_mcp_server`.

## Configuration Steps

### 1. Set Your API Key

Edit the `.env` file and replace the placeholder with your actual Magisterium API key:

```bash
cd /var/www/magisterium_mcp_server
nano .env
```

Replace the content with:
```
MAGISTERIUM_API_KEY=your-actual-api-key-here
```

### 2. Test the Server

Run the test script to verify everything is working:

```bash
node test-server.js
```

You should see a JSON response with the `magisterium_query` tool listed.

### 3. Configure MCP Clients

#### For Cursor IDE:
Add this configuration to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "magisterium": {
      "command": "node",
      "args": ["mcp-magisterium.cjs"],
      "cwd": "/var/www/magisterium_mcp_server",
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### For Claude Desktop:
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "magisterium": {
      "command": "node",
      "args": ["mcp-magisterium.cjs"],
      "cwd": "/var/www/magisterium_mcp_server"
    }
  }
}
```

## Usage

Once configured, you can use the `magisterium_query` tool with:

- **query** (required): Your question about Catholic Church teaching
- **model** (optional): Model to use (default: "magisterium-1")
- **return_related_questions** (optional): Whether to return related questions (default: true)

### Example:
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

## Troubleshooting

1. **Node.js Version**: The server works with Node.js 16.15.1, but some dependencies recommend Node.js 18+. If you encounter issues, consider upgrading Node.js.

2. **API Key**: Ensure your `.env` file contains a valid Magisterium API key.

3. **Permissions**: Make sure the server has read/write permissions to the directory.

4. **Test the Server**: Use `node test-server.js` to verify the server is working correctly.

## Files

- `mcp-magisterium.cjs` - The compiled MCP server (recommended for production)
- `mcp-magisterium.ts` - TypeScript source code
- `mcp-config.json` - Configuration template
- `.env` - Environment variables (contains API key)
- `test-server.js` - Test script to verify functionality

## Support

For issues or questions, refer to the original repository: https://github.com/JacobStephens2/magisterium_mcp_server






