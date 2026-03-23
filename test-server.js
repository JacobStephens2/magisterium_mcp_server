#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Testing Magisterium MCP Server...\n');

const mcpProcess = spawn('node', ['dist/mcp-magisterium.js'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let stderr = '';

mcpProcess.stdout.on('data', (data) => { output += data.toString(); });
mcpProcess.stderr.on('data', (data) => { stderr += data.toString(); });

const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" }
  }
};

const listToolsRequest = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {}
};

function fail(message) {
  console.error(`FAIL: ${message}`);
  mcpProcess.kill();
  process.exit(1);
}

mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

setTimeout(() => {
  mcpProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 500);

setTimeout(() => {
  mcpProcess.kill();

  const lines = output.split('\n').filter(Boolean);

  if (lines.length < 2) {
    fail(`Expected 2 responses, got ${lines.length}. stderr: ${stderr}`);
  }

  let initResponse, toolsResponse;
  try {
    initResponse = JSON.parse(lines[0]);
    toolsResponse = JSON.parse(lines[1]);
  } catch {
    fail(`Failed to parse JSON responses.\nLine 0: ${lines[0]}\nLine 1: ${lines[1]}`);
  }

  // Verify initialize response
  if (!initResponse.result?.serverInfo?.name) {
    fail(`Initialize response missing serverInfo: ${JSON.stringify(initResponse)}`);
  }

  // Verify tools/list response
  const tools = toolsResponse.result?.tools;
  if (!Array.isArray(tools) || tools.length === 0) {
    fail(`No tools returned: ${JSON.stringify(toolsResponse)}`);
  }

  const magTool = tools.find(t => t.name === 'magisterium_query');
  if (!magTool) {
    fail(`magisterium_query tool not found. Tools: ${tools.map(t => t.name).join(', ')}`);
  }

  const required = magTool.inputSchema?.required;
  if (!required?.includes('query')) {
    fail(`magisterium_query missing required 'query' parameter`);
  }

  console.log(`Server: ${initResponse.result.serverInfo.name} v${initResponse.result.serverInfo.version}`);
  console.log(`Protocol: ${initResponse.result.protocolVersion}`);
  console.log(`Tools: ${tools.map(t => t.name).join(', ')}`);
  console.log('\nAll checks passed.');
  process.exit(0);
}, 2000);
