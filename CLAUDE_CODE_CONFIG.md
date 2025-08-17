# Claude Code MCP Configuration

## Quick Setup

Add this to your Claude Code settings file (`~/Library/Application Support/Claude/claude_code_config.json` on macOS):

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

## Important Notes

1. **Build First**: Always build the project before using:
   ```bash
   cd /Users/flrngel/project/personal/mcp-master-puppeteer
   npm install
   npm run build
   ```

2. **Absolute Path Required**: Use the full absolute path to `dist/index.js`

3. **Node Required**: The command must be `node`, not `npx` or direct execution

## Troubleshooting

### Server Not Loading

1. Check if the server works standalone:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0.0","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node /Users/flrngel/project/personal/mcp-master-puppeteer/dist/index.js
   ```
   
   You should see a JSON response with `serverInfo`.

2. Check Claude Code logs for errors

3. Ensure the path in the config is correct

### Browser Issues

If Puppeteer can't launch browsers:

```bash
cd /Users/flrngel/project/personal/mcp-master-puppeteer
npx puppeteer browsers install firefox
```

Or for Chrome:
```bash
npx puppeteer browsers install chrome
```

### Docker Environment

If running in Docker, add environment variables:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "PUPPETEER_ARGS": "[\"--no-sandbox\", \"--disable-setuid-sandbox\"]"
      }
    }
  }
}
```

## Available Tools

Once configured, you'll have access to:

- `puppeteer_navigate_analyze` - Navigate to URLs and analyze pages
- `puppeteer_screenshot_plus` - Take screenshots with various options
- `puppeteer_extract_content` - Extract content from pages
- `puppeteer_get_page_info` - Get SEO and metadata
- `puppeteer_analyze_forms` - Analyze forms on pages
- `puppeteer_batch_interact` - Perform multiple interactions
- `puppeteer_click` - Click elements
- `puppeteer_fill` - Fill form fields

## Verification

After configuration, restart Claude Code and check if the tools are available by asking Claude to list available MCP tools.