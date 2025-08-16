#!/bin/bash

# Magisterium MCP Server Startup Script

echo "Starting Magisterium MCP Server..."

# Check if .env file exists and has API key
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with your Magisterium API key:"
    echo "MAGISTERIUM_API_KEY=your-actual-api-key-here"
    exit 1
fi

# Check if API key is set (not the placeholder)
if grep -q "your-actual-api-key-here" .env; then
    echo "Warning: Please update your .env file with a real Magisterium API key"
    echo "Current .env file contains placeholder text"
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if the MCP server file exists
if [ ! -f mcp-magisterium.cjs ]; then
    echo "Error: mcp-magisterium.cjs not found!"
    echo "Please ensure the server files are properly installed"
    exit 1
fi

echo "Server files found. Starting MCP server..."
echo "The server will run on stdio and is ready for MCP client connections."
echo "Press Ctrl+C to stop the server."

# Start the MCP server
node mcp-magisterium.cjs






