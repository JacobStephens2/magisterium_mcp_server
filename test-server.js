#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the MCP server
console.log('Testing Magisterium MCP Server...\n');

const mcpProcess = spawn('node', ['mcp-magisterium.cjs'], {
  cwd: __dirname,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a test request
const testRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

mcpProcess.stdin.write(JSON.stringify(testRequest) + '\n');

let output = '';
mcpProcess.stdout.on('data', (data) => {
  output += data.toString();
});

mcpProcess.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

mcpProcess.on('close', (code) => {
  console.log('Server response:');
  console.log(output);
  console.log(`\nServer exited with code ${code}`);
});

// Close the process after a short delay
setTimeout(() => {
  mcpProcess.kill();
}, 2000);
