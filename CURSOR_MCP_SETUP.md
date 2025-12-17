# Cursor MCP Setup Guide

## Problem: "0 tools enabled" in Cursor MCP Tools

Follow these steps to properly configure the Magisterium MCP tool in Cursor:

## Step 1: Install Dependencies

First, ensure all Node.js dependencies are installed:

```bash
cd /path/to/magisterium_mcp_server
npm install
```

This installs the required packages including `@modelcontextprotocol/sdk` and `dotenv`.

## Step 2: Verify API Key

Ensure the `.env` file exists and contains your API key:

```bash
cd /path/to/magisterium_mcp_server
cat .env
```

The file should contain:
```
MAGISTERIUM_API_KEY=your-actual-api-key-here
```

## Step 3: Test Server Manually

Test the MCP server manually to verify it works:

```bash
cd /path/to/magisterium_mcp_server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node mcp-magisterium.cjs
```

You should see a JSON response with the `magisterium_query` tool. If you see "injecting env (1) from .env", the API key is being loaded correctly.

## Step 4: Create Wrapper Script (Recommended)

Create a wrapper script to ensure the correct working directory and environment:

```bash
cd /path/to/magisterium_mcp_server
cat > run-magisterium.sh << 'EOF'
#!/bin/bash
cd /path/to/magisterium_mcp_server
exec node mcp-magisterium.cjs
EOF
chmod +x run-magisterium.sh
```

**Important:** Replace `/path/to/magisterium_mcp_server` with your actual installation path.

## Step 5: Configure Cursor

Cursor uses MCP configuration files in two locations (workspace-specific takes precedence):

1. **Workspace-specific**: `{workspace_root}/.cursor/mcp.json` (recommended for project-specific setups)
2. **Global**: `~/.config/cursor/mcp.json` (for all workspaces)

### Option A: Using Wrapper Script (Recommended - Most Reliable)

Add this configuration to your Cursor MCP settings file:

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

**Important:** Replace `/path/to/magisterium_mcp_server` with your actual installation path.

### Option B: Direct Node Command (Alternative)

If the wrapper script doesn't work, try this direct approach:

```json
{
  "mcpServers": {
    "magisterium": {
      "command": "node",
      "args": ["mcp-magisterium.cjs"],
      "cwd": "/path/to/magisterium_mcp_server"
    }
  }
}
```

**Note:** Option B may fail if Cursor doesn't respect the `cwd` setting. If you see errors about missing files, use Option A instead.

### Option C: Using TypeScript Version (Advanced)

```json
{
  "mcpServers": {
    "magisterium": {
      "command": "node",
      "args": ["--loader", "ts-node/esm", "mcp-magisterium.ts"],
      "cwd": "/path/to/magisterium_mcp_server"
    }
  }
}
```

## Step 6: Restart Cursor

After adding the configuration:
1. Save the MCP configuration file
2. **Completely quit and restart Cursor** (not just reload the window)
3. Open Cursor Settings → MCP Tools
4. Enable the "magisterium" server
5. Check MCP Tools - should now show "1 tool enabled"

## Step 7: Test the Tool

Once enabled, you can use the `magisterium_query` tool with:
- **query**: "What does the Catholic Church teach about prayer?"
- **model**: "magisterium-1" (optional, default)
- **return_related_questions**: true (optional, default)

## Troubleshooting

### Error: "Cannot find module '/path/mcp-magisterium.cjs'"

**Problem:** Cursor is not finding the script file, often because the `cwd` setting isn't being respected.

**Solutions:**
1. Use the wrapper script approach (Option A) - this is the most reliable
2. Check that you're editing the correct config file (workspace vs global)
3. Verify the file path is correct and the file exists
4. Ensure the wrapper script is executable: `chmod +x run-magisterium.sh`

### Error: "Cannot find module '@modelcontextprotocol/sdk'"

**Problem:** Dependencies are not installed.

**Solution:** Run `npm install` in the magisterium_mcp_server directory.

### Error: "injecting env (0) from .env"

**Problem:** The `.env` file is not being found or is empty.

**Solutions:**
1. Verify the `.env` file exists in the magisterium_mcp_server directory
2. Check that the file contains `MAGISTERIUM_API_KEY=your-key`
3. Use the wrapper script approach to ensure correct working directory
4. Verify file permissions: `ls -la .env`

### "0 tools enabled" after configuration

**Problem:** Configuration not being read or server not starting.

**Solutions:**
1. Check Cursor's MCP logs (usually in Settings → MCP Tools → View Logs)
2. Verify you're editing the correct config file:
   - Workspace config: `{workspace_root}/.cursor/mcp.json` (takes precedence)
   - Global config: `~/.config/cursor/mcp.json`
3. Ensure JSON syntax is valid (no trailing commas, proper quotes)
4. Try the wrapper script approach (Option A)
5. Completely restart Cursor (quit and reopen, not just reload)

### Server works manually but not in Cursor

**Problem:** Path or environment issues specific to how Cursor launches the process.

**Solutions:**
1. Use absolute paths in the configuration (not relative)
2. Use the wrapper script approach
3. Check Cursor's MCP logs for specific error messages
4. Verify Node.js is in PATH when Cursor runs: Check if `which node` works

## Configuration File Locations

- **Workspace-specific**: `{workspace_root}/.cursor/mcp.json` - Takes precedence, good for project-specific setups
- **Global**: `~/.config/cursor/mcp.json` - Applies to all workspaces

If you have both, the workspace-specific file will be used. Make sure to update the correct one!

## Files Available

- `mcp-magisterium.ts` - TypeScript source
- `mcp-magisterium.cjs` - Compiled CommonJS version (recommended)
- `run-magisterium.sh` - Wrapper script (create this using Step 4)
- `mcp-config-cjs.json` - Sample configuration for CommonJS version
- Various other config files for different setups 