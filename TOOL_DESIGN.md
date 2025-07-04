# Enhanced MCP Puppeteer Tools Design

## Design Principles

1. **Minimize tool chaining** - Each tool should return comprehensive data to avoid multiple calls
2. **Rich metadata** - Include status codes, timings, dimensions, errors
3. **Token efficiency** - Return markdown/structured data instead of raw HTML
4. **Error transparency** - Capture and return console logs, network errors, JS errors

## Enhanced Tools

### 1. puppeteer_navigate_analyze
Navigate to a URL and return comprehensive page analysis.

**Returns:**
- Status code and response headers
- Page title, description, meta tags
- Simplified HTML structure as markdown
- Console logs and errors encountered
- Load timing metrics
- Redirect chain if any

### 2. puppeteer_screenshot_plus  
Take screenshots with rich metadata.

**Returns:**
- Screenshot(s) in specified format
- Page dimensions (viewport and full content)
- Load metrics and timestamp
- Console/network errors summary
- Element visibility information

**Features:**
- Multi-breakpoint support
- Actions before screenshot
- Image optimization options

### 3. puppeteer_extract_content
Extract page content as structured markdown.

**Returns:**
- Page text organized by headings
- Links with context
- Images with alt text
- Forms and inputs structure
- Tables as markdown

### 4. puppeteer_get_page_info
Get page metadata without screenshot.

**Returns:**
- All meta tags (og, twitter, etc)
- Page structure outline
- Resource counts (images, scripts, styles)
- Performance metrics
- Accessibility basics

### 5. puppeteer_analyze_forms
Analyze all forms on the page.

**Returns:**
- Form details (action, method)
- All inputs with types and attributes
- Select options
- Validation requirements
- Submit buttons

### 6. puppeteer_batch_interact
Execute multiple actions and return results.

**Input:**
- Array of actions (click, type, select, etc)
- Options for error handling

**Returns:**
- Success/failure for each action
- Page state changes
- Console output during execution
- Final page URL and title

## Implementation Plan

1. Create modular structure:
   - `/src/tools/` - Tool implementations
   - `/src/utils/` - Shared utilities
   - `/src/types/` - TypeScript interfaces

2. Shared utilities needed:
   - HTML to Markdown converter
   - Error collector
   - Performance metrics collector
   - Page structure analyzer

3. Testing approach:
   - Unit tests for utilities
   - Integration tests with test pages
   - Mock browser for fast tests