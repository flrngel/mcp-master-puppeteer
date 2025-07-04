# MCP Master Puppeteer

An advanced MCP (Model Context Protocol) server for browser automation using Puppeteer, designed with rich data returns and minimal tool chaining.

## Features

### 🎯 Enhanced Tools with Descriptive Returns

Each tool returns comprehensive, self-documenting data:

- **Clear Format Indicators**: Know exactly what format your content is in (markdown, HTML, JSON)
- **Processing Metadata**: See what transformations were applied to the data
- **Descriptive Field Names**: Nested objects group related data logically
- **Rich Statistics**: Word counts, file sizes, dimensions, and more

### 📊 Available Tools

1. **puppeteer_navigate_analyze** - Navigate and analyze pages
   - Returns: navigation info, content (with format), metadata, performance metrics
   - Options: `contentFormat` (markdown/html/plain-text), `includeRawHtml`

2. **puppeteer_screenshot_plus** - Capture screenshots with metadata
   - Returns: detailed image data, dimensions, file sizes, capture settings
   - Options: format (png/jpeg/webp), quality, breakpoints, optimization

3. **puppeteer_extract_content** - Extract structured content
   - Returns: document structure, word counts, reading time, formatted output
   - Options: `outputFormat` (markdown/html/plain-text/json), `includeRawHtml`

4. **puppeteer_get_page_info** - Comprehensive page analysis
   - Returns: SEO assessment, accessibility metrics, performance indicators
   - Includes: meta tags, heading structure, landmark detection

5. **puppeteer_analyze_forms** - Analyze all forms
   - Returns: form purposes, field analysis, security features
   - Detects: login, registration, contact, search forms

6. **puppeteer_batch_interact** - Execute action sequences
   - Returns: detailed execution results, state changes, timing
   - Supports: click, type, select, hover, scroll, wait

### 🚀 Key Design Principles

1. **Minimize Tool Chaining**: Each tool returns all relevant data in one call
2. **Self-Documenting Returns**: Field names clearly indicate content and format
3. **Token Efficiency**: Markdown conversion reduces token usage vs raw HTML
4. **Error Transparency**: Comprehensive error collection and categorization

## Installation

```bash
npm install mcp-master-puppeteer

# Or run directly
npx mcp-master-puppeteer
```

## Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "mcp-master-puppeteer",
      "args": [],
      "env": {
        "PUPPETEER_ARGS": "{\"headless\": false}"
      }
    }
  }
}
```

## Usage Examples

### Navigate with Format Options

```javascript
// Get markdown summary
await puppeteer_navigate_analyze({
  url: "https://example.com",
  contentFormat: "markdown",
  includeRawHtml: false
});

// Returns:
{
  navigationInfo: {
    statusCode: 200,
    finalUrl: "https://example.com",
    redirectChain: [],
    navigationTimeMs: 1250
  },
  content: {
    format: "markdown",
    data: "# Example Domain\n\n## Page Structure...",
    processing: {
      method: "turndown",
      stats: {
        originalSizeBytes: 1256,
        processedSizeBytes: 487,
        reductionPercent: 61
      }
    }
  },
  pageMetadata: {
    title: "Example Domain",
    description: "...",
    openGraph: {},
    twitterCard: {}
  }
}
```

### Extract Content in Different Formats

```javascript
// Get structured JSON
await puppeteer_extract_content({
  outputFormat: "structured-json",
  includeRawHtml: false
});

// Returns organized data with:
// - Word counts and reading time
// - Heading hierarchy with slugs
// - Links with validation
// - Images with accessibility info
// - Tables as markdown
```

### Capture Screenshots with Metadata

```javascript
await puppeteer_screenshot_plus({
  name: "homepage",
  breakpoints: [375, 768, 1280],
  format: "jpeg",
  quality: 85,
  optimizeForSize: true
});

// Returns for each breakpoint:
// - Viewport configuration
// - Image dimensions and aspect ratio
// - File size (bytes and formatted)
// - Capture timing
// - Browser metadata
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Test enhanced features
npx tsx tests/test-manual-enhanced.ts
```

## Environment Variables

- `PUPPETEER_ARGS` - JSON string of Puppeteer launch options
- `PUPPETEER_HEADLESS` - Set to "false" for headful mode
- `DOCKER_CONTAINER` - Enables Docker-compatible browser args

## License

MIT