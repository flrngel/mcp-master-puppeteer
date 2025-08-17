#!/usr/bin/env node

// Re-export everything from src for module usage
export * from './src/index.js';

// Run the server when this file is executed directly
import { runServer } from './src/index.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(console.error);
}