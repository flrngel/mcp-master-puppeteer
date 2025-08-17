# MCP Integration Guide

This document explains how to integrate the mcp-master-puppeteer server with MCP-compatible clients.

## Prerequisites

1. Build the project first:
```bash
npm install
npm run build
```

## Integration Methods

### Method 1: Using NPM Package (Recommended)

1. Install the package in your project:
```bash
npm install /path/to/mcp-master-puppeteer
```

2. Configure in your MCP client (e.g., Claude Desktop):
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["node_modules/mcp-master-puppeteer/dist/index.js"]
    }
  }
}
```

### Method 2: Using Absolute Path

Configure directly in your MCP client configuration:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["/Users/flrngel/project/personal/mcp-master-puppeteer/dist/index.js"]
    }
  }
}
```

### Method 3: Using NPX

If published to npm:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["mcp-master-puppeteer"]
    }
  }
}
```

## Claude Desktop Configuration

Add to your Claude Desktop configuration file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Example configuration:
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["/Users/flrngel/project/personal/mcp-master-puppeteer/dist/index.js"],
      "env": {
        "PUPPETEER_ARGS": "[\"--no-sandbox\", \"--disable-setuid-sandbox\"]"
      }
    }
  }
}
```

## Testing the Integration

1. Test the server directly:
```bash
node dist/index.js
# Then send: {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0.0","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
```

2. Use the test script:
```bash
node test-mcp-integration.js
```

## Available Tools

Once integrated, the following tools will be available:
- `puppeteer_navigate_analyze` - Navigate and analyze pages
- `puppeteer_screenshot_plus` - Take screenshots with options
- `puppeteer_extract_content` - Extract page content
- `puppeteer_get_page_info` - Get page metadata and SEO info
- `puppeteer_analyze_forms` - Analyze forms on the page
- `puppeteer_batch_interact` - Execute multiple interactions
- `puppeteer_click` - Click elements
- `puppeteer_fill` - Fill input fields

## Troubleshooting

### Server Not Loading

1. Ensure the project is built:
```bash
npm run build
```

2. Check the path is correct:
```bash
ls -la dist/index.js
```

3. Test the server directly:
```bash
node dist/index.js
```

### Permission Issues

Make sure the entry point is executable:
```bash
chmod +x dist/index.js
```

### Browser Issues

If Puppeteer can't launch the browser:
```bash
# Install browsers
npx puppeteer browsers install firefox

# Or use environment variables for Docker
export PUPPETEER_ARGS='["--no-sandbox", "--disable-setuid-sandbox"]'
```

## Environment Variables

- `PUPPETEER_ARGS` - JSON array of Puppeteer launch arguments
- `DOCKER_CONTAINER` - Set to any value to use Docker-compatible settings

## Development

For development, you can run the server in watch mode:
```bash
npm run watch
```

Then point your MCP client to the dist/index.js file.