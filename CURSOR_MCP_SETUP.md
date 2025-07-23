# Cursor MCP Setup Guide

## Problem: "0 tools enabled" in Cursor MCP Tools

Follow these steps to properly configure the Magisterium MCP tool in Cursor:

## Step 1: Verify Server Works

Test the MCP server manually:
```bash
cd /Users/pink/Documents/magisterium
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node mcp-magisterium.cjs
```

You should see a JSON response with the `magisterium_query` tool.

## Step 2: Configure Cursor

Add this configuration to your Cursor MCP settings:

### Option A: Using the TypeScript version (with ts-node)
```json
{
  "mcpServers": {
    "magisterium": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "mcp-magisterium.ts"],
      "cwd": "/Users/pink/Documents/magisterium"
    }
  }
}
```

### Option B: Using the compiled CommonJS version (recommended)
```json
{
  "mcpServers": {
    "magisterium": {
      "command": "node",
      "args": ["mcp-magisterium.cjs"],
      "cwd": "/Users/pink/Documents/magisterium"
    }
  }
}
```

## Step 3: Restart Cursor

After adding the configuration:
1. Save the MCP configuration
2. Completely restart Cursor
3. Check MCP Tools - should now show "1 tool enabled"

## Step 4: Test the Tool

Once enabled, you can use the `magisterium_query` tool with:
- **query**: "What does the Catholic Church teach about prayer?"
- **model**: "magisterium-1" (optional)
- **return_related_questions**: true (optional)

## Troubleshooting

- Ensure the `.env` file contains `MAGISTERIUM_API_KEY=your-api-key`
- Verify the file paths are correct for your system
- Check Cursor's MCP logs for any error messages
- Try the CommonJS version (Option B) if the TypeScript version fails

## Files Available

- `mcp-magisterium.ts` - TypeScript source
- `mcp-magisterium.cjs` - Compiled CommonJS version
- `mcp-config-cjs.json` - Configuration for CommonJS version
- Various other config files for different setups 