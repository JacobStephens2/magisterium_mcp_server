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

mcpProcess.stdout.on('data', (data) => {
  output += data.toString();
});

mcpProcess.stderr.on('data', (data) => {
  const msg = data.toString().trim();
  if (msg) console.error('stderr:', msg);
});

// MCP requires an initialize handshake before listing tools
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

mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

setTimeout(() => {
  mcpProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
}, 500);

setTimeout(() => {
  if (output) {
    console.log('Server responses:');
    output.split('\n').filter(Boolean).forEach((line) => {
      try {
        const parsed = JSON.parse(line);
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log(line);
      }
    });
    console.log('\nServer is working correctly.');
  } else {
    console.log('No response received from server.');
  }
  mcpProcess.kill();
}, 2000);
