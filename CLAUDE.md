# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides browser automation capabilities through Puppeteer. The server allows AI assistants to interact with web browsers for tasks like navigation, screenshots, form filling, and JavaScript execution.

## Commands

### Build and Development
- `npm run build` - Compiles TypeScript to JavaScript and makes the output executable
- `npm run watch` - Watches for file changes and rebuilds automatically
- `npm run prepare` - Runs build as part of npm install lifecycle
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Installation
- `npm install` - Installs dependencies and automatically installs Firefox browsers via puppeteer

### Testing
- `npx tsx tests/test-manual.ts` - Run manual integration test

## Architecture

### Core Structure
The project implements an MCP server using the `@modelcontextprotocol/sdk` with Puppeteer for browser automation. The codebase is organized into:

1. **Entry Points**:
   - `/index.ts` - Re-exports from src
   - `/src/index.ts` - Main server implementation with tool handlers

2. **Enhanced Tool Definitions** (`/src/tools/`):
   - `navigateAnalyze` - Navigate and analyze pages with metadata, content extraction, and error tracking
   - `screenshotPlus` - Advanced screenshots with multi-breakpoint support and page metrics
   - `extractContent` - Extract structured content as markdown
   - `getPageInfo` - Comprehensive page metadata, SEO, and accessibility info
   - `analyzeForms` - Analyze forms with input details and purpose detection
   - `batchInteract` - Execute multiple page actions in sequence

3. **Utilities** (`/src/utils/`):
   - `browserManager` - Manages browser lifecycle and page actions
   - `errorCollector` - Collects JavaScript, console, and network errors
   - `htmlToMarkdown` - Converts HTML to markdown using Turndown
   - `pageAnalyzer` - Extracts metadata, dimensions, and page structure

4. **Types** (`/src/types/`):
   - Comprehensive TypeScript interfaces for all tool inputs/outputs

3. **Resource System**:
   - Console logs are captured and available via `console://logs`
   - Screenshots are stored in memory and accessible via `screenshot://{name}`

### Key Technical Details

1. **Enhanced Tools Design**:
   - Each tool returns comprehensive data to minimize tool chaining
   - Structured metadata extraction (SEO, accessibility, performance)
   - Error collection and summarization for all operations
   - HTML to markdown conversion for token efficiency

2. **Browser Management**:
   - Singleton browser instance with lazy initialization
   - Supports custom Puppeteer arguments via environment variables
   - Docker-compatible with special arguments
   - Graceful cleanup on process termination

3. **Data Collection**:
   - Page errors: JavaScript, console, network, security
   - Performance metrics: Load time, resource counts
   - Content extraction: Headings, paragraphs, links, images, tables
   - Form analysis: Input types, validation, purpose detection

4. **Testing Infrastructure**:
   - Jest with TypeScript support
   - Unit tests for utilities
   - Integration tests with test server
   - Manual test script for quick verification

## Environment Variables

- `PUPPETEER_ARGS` - JSON string of custom Puppeteer launch arguments
- `DOCKER_CONTAINER` - When set, uses Docker-compatible browser arguments

## Error Handling

All tools return structured results with:
- `content` array containing text and/or image responses
- `isError` boolean flag
- Detailed error messages for debugging

## MCP Integration

The server is designed to work with MCP-compatible hosts like Claude Desktop or Cursor. It uses:
- JSON-RPC 2.0 protocol over stdio
- Tool schema validation
- Resource notifications for dynamic content updates

## Token Optimization Strategies

### Key Learnings (2025-07-04)

1. **Selective Returns Pattern**:
   - Tools should return minimal data by default, with opt-in flags for additional information
   - Example: `navigateAnalyze` uses `includeMetadata` and `includePerformance` flags
   - Default to "none" content format for fastest response when only status/title needed

2. **Smart Defaults Based on Use Case**:
   - `includeMetadata=true` by default (agents often need basic metadata like description)
   - `includePerformance=false` by default (only needed for debugging)
   - `contentFormat='none'` by default (agents can request content when needed)

3. **Avoid Redundant Data**:
   - Never return both markdown AND html content
   - Remove calculated fields like `sizeBytes` or `reductionPercent`
   - Only include errors when they exist (no empty arrays)

4. **Image Resizing for LLMs**:
   - Claude.ai limits: 8000×8000 for single images, 2000×2000 for multiple
   - Auto-detect and apply appropriate limits based on screenshot count
   - Use dimension-based limits (max width OR height), not total pixels

5. **Return Structure Optimization**:
   - Group related optional data (e.g., all metadata fields together)
   - Use undefined/omit pattern rather than null values
   - Keep essential fields at top level for easy access

### Implementation Examples

```typescript
// BAD: Everything returned always
return {
  url, statusCode, title, content, 
  metadata: {...}, performance: {...}, 
  errors: [], sizeBytes: 12345
}

// GOOD: Progressive enhancement
return {
  url, statusCode, title,
  ...(includeContent && { content }),
  ...(includeMetadata && metadata && { metadata }),
  ...(errors.length > 0 && { errors })
}
```

### Testing Commands
- `npx tsx tests/test-optimized.ts` - Test token optimization
- `npx tsx tests/test-screenshot-resize.ts` - Test LLM-compatible resizing
- `npx tsx tests/test-none-format.ts` - Test minimal content format