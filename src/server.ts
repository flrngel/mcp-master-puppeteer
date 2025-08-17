#!/usr/bin/env node

/**
 * MCP Server Entry Point
 * This file ensures the server runs properly when invoked by MCP clients
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from './index.js';
import { closeBrowser } from './utils/browserManager.js';

// Create and connect the transport
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Server is now running and handling stdio
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle various termination signals
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});