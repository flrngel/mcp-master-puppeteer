# MCP Master Puppeteer

> `claude mcp add mcp-master-puppeteer -- npx -y github:flrngel/mcp-master-puppeteer#main`

An advanced MCP (Model Context Protocol) server for browser automation using Puppeteer, optimized for minimal token usage while providing comprehensive data when needed.

## Features

### 🎯 Token-Optimized Returns

Each tool is designed to minimize token usage while maintaining utility:

- **Minimal by Default**: Only essential data returned unless requested
- **No Duplicate Content**: Never returns both markdown and HTML
- **Smart Defaults**: Optimized for agent decision-making
- **Optional Enrichment**: Use flags to request additional data

### 🚀 Key Design Principles

1. **Token Efficiency First**: 60-70% reduction in response size
2. **Smart Selective Returns**: Only include data that aids decision-making
3. **No Redundancy**: Eliminated duplicate data and unnecessary metadata
4. **Progressive Enhancement**: Start minimal, add detail as needed

## 📊 Available Tools

### 1. puppeteer_navigate_analyze

Navigate to a URL and return page status, title, and optionally content/metadata. Default contentFormat is "none" for fastest response.

**Options:**
```typescript
{
  url: string;                    // Required: URL to navigate to
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";  // Default: "networkidle0"
  timeout?: number;               // Navigation timeout in ms (default: 30000)
  contentFormat?: "markdown" | "html" | "plain-text";  // Default: "markdown"
  includeMetadata?: boolean;      // Include page metadata (default: false)
  includePerformance?: boolean;   // Include performance metrics (default: false)
}
```

**Returns:**
```typescript
{
  navigationInfo: {
    originalUrl: string;
    finalUrl: string;
    statusCode: number;
    statusText: string;
    redirectChain: string[];
    navigationTimeMs: number;
  };
  // Always included - minimal essential data
  url: string;                    // Final URL after redirects
  statusCode: number;
  title: string;
  content?: string;                // Omitted if contentFormat is "none"
  contentFormat: ContentFormat;
  
  // Optional - only if there are errors
  errors?: PageError[];
  
  // Optional - only if includeMetadata is true
  metadata?: {
    redirectChain?: string[];
    description?: string;
    openGraph?: Record<string, string>;
    twitterCard?: Record<string, string>;
  };
  
  // Optional - only if includePerformance is true
  performance?: {
    loadTimeMs: number;
    resourceCounts: {
      total: number;
      images: number;
      scripts: number;
      stylesheets: number;
    };
  };
}
```

### 2. puppeteer_screenshot_plus

Take screenshots optimized for LLM processing with automatic resizing to stay under dimension limits. Automatically adjusts to Claude.ai's limits: 8000×8000 for single images, 2000×2000 for multiple images.

**Options:**
```typescript
{
  name: string;                   // Required: Name for the screenshot(s)
  breakpoints?: number[];         // Viewport widths (default: [375, 768, 1280])
  selector?: string;              // CSS selector for element screenshot
  fullPage?: boolean;             // Capture full page height (default: true)
  format?: "png" | "jpeg" | "webp";  // Image format (default: "jpeg")
  quality?: number;               // JPEG/WebP quality 0-100 (default: 80)
  actions?: PageAction[];         // Actions to perform before screenshot
  resizeForLLM?: boolean;         // Resize to stay under max dimension (default: true)
  maxDimension?: number;          // Max width or height. Default: 8000 (single), 2000 (multiple)
  resizeStrategy?: "cut" | "resize";  // How to handle oversized images (default: "cut")
}
```

**Returns:**
```typescript
{
  screenshots: Array<{
    viewport: { width: number; height: number };
    dataUrl: string;            // Complete data URL ready to use
    format: "png" | "jpeg" | "webp";
    dimensions: {
      width: number;
      height: number;
      aspectRatio: string;      // e.g., "16:9"
    };
    fullPage: boolean;
  }>;
  
  // Optional - only if there are errors
  errors?: PageError[];
}
```

### 3. puppeteer_extract_content

Extract structured content from the page with format options and detailed metadata.

**Options:**
```typescript
{
  selector?: string;              // CSS selector to extract from (default: full page)
  includeHidden?: boolean;        // Include hidden elements (default: false)
  outputFormat?: "markdown" | "html" | "plain-text" | "structured-json";  // Default: "markdown"
  includeAnalysis?: boolean;      // Include detailed structure analysis (default: false)
}
```

**Returns:**
```typescript
{
  // Always included
  content: string;                // In requested format
  contentFormat: ContentFormat;
  wordCount: number;
  
  // Optional - only if includeAnalysis is true
  analysis?: {
    headings: Array<{
      level: 1 | 2 | 3 | 4 | 5 | 6;
      text: string;
    }>;
    links: Array<{
      text: string;
      url: string;
      external: boolean;
    }>;
    images: Array<{
      src: string;
      alt?: string;
    }>;
    tables: number;               // Just count
    lists: {
      ordered: number;
      unordered: number;
    };
  };
}
```

### 4. puppeteer_get_page_info

Get comprehensive page metadata, SEO assessment, accessibility metrics, and performance indicators.

**Options:**
```typescript
{
  sections?: Array<"seo" | "accessibility" | "performance" | "metadata">;  // Default: ["seo"]
}
```

**Returns:**
```typescript
{
  pageIdentification: {
    currentUrl: string;
    canonicalUrl?: string;
    title: string;
    language?: string;
    charset?: string;
    lastModified?: string;
  };
  metadataAnalysis: {
    metaTags: {
      basic: {
        description?: string;
        keywords?: string;
        author?: string;
        robots?: string;
        viewport?: string;
      };
      openGraph: Record<string, string>;
      twitterCard: Record<string, string>;
      dublin: Record<string, string>;
      other: Record<string, string>;
    };
    structuredData: {
      hasJsonLd: boolean;
      hasMicrodata: boolean;
      hasRDFa: boolean;
      schemas: string[];
    };
  };
  seoAssessment: {
    titleAnalysis: {
      exists: boolean;
      content: string;
      lengthCharacters: number;
      isOptimal: boolean;      // 30-60 chars
      issues: string[];
    };
    descriptionAnalysis: {
      exists: boolean;
      content?: string;
      lengthCharacters: number;
      isOptimal: boolean;      // 120-160 chars
      issues: string[];
    };
    headingStructure: {
      hasH1: boolean;
      h1Count: number;
      h1Content: string[];
      totalHeadings: number;
      isHierarchical: boolean;
      issues: string[];
    };
    canonicalStatus: {
      hasCanonical: boolean;
      canonicalUrl?: string;
      isSelfReferencing: boolean;
      issues: string[];
    };
    crawlability: {
      isIndexable: boolean;
      robotsDirectives: string[];
      sitemapReference?: string;
    };
  };
  accessibilityMetrics: {
    documentStructure: {
      hasProperDoctype: boolean;
      hasLangAttribute: boolean;
      declaredLanguage?: string;
      hasTitle: boolean;
    };
    landmarks: {
      hasMain: boolean;
      hasNav: boolean;
      hasHeader: boolean;
      hasFooter: boolean;
      hasAside: boolean;
      landmarkRoles: string[];
      skipLinks: boolean;
    };
    headingAnalysis: {
      properHierarchy: boolean;
      headingLevels: number[];
      missingLevels: number[];
    };
    imageAccessibility: {
      totalImages: number;
      imagesWithAlt: number;
      imagesWithEmptyAlt: number;
      decorativeImages: number;
      altTextCoveragePercent: number;
      missingAltImages: number;
    };
    formAccessibility: {
      totalForms: number;
      formsWithLabels: number;
      inputsWithoutLabels: number;
      ariaUsage: boolean;
    };
  };
  performanceIndicators: {
    pageWeight: {
      htmlSizeBytes: number;
      totalResourcesBytes?: number;
      imageOptimization: "good" | "needs-improvement" | "poor";
    };
    resourceCounts: {
      totalRequests: number;
      images: number;
      scripts: number;
      stylesheets: number;
      fonts: number;
      other: number;
    };
    criticalMetrics?: {
      hasViewportMeta: boolean;
      hasFaviconDefined: boolean;
      usesHTTPS: boolean;
      hasServiceWorker: boolean;
    };
  };
  pageStructureOutline: string;
}
```

### 5. puppeteer_analyze_forms

Analyze all forms on the page with detailed field information and purpose detection.

**Options:**
```typescript
// No options - analyzes all forms on the current page
```

**Returns:**
```typescript
{
  formCount: number;
  forms: FormInfo[];            // Basic form information
  summary: {
    totalInputs: number;
    inputTypes: Record<string, number>;
    requiredFields: number;
    hasFileUpload: boolean;
    hasPasswordField: boolean;
    formPurposes: string[];     // Detected purposes
  };
}
```

### 6. puppeteer_batch_interact

Execute multiple page interactions in sequence with detailed results.

**Options:**
```typescript
{
  actions: Array<{
    type: "click" | "type" | "select" | "hover" | "wait" | "waitForSelector" | "scroll" | "clear" | "press";
    selector?: string;          // Required for most actions
    value?: string;             // For select
    text?: string;              // For type
    key?: string;               // For press
    duration?: number;          // For wait (ms)
    timeout?: number;           // For waitForSelector (ms)
    position?: { x: number; y: number };  // For scroll
  }>;
  stopOnError?: boolean;        // Stop on first error (default: false)
}
```

**Returns:**
```typescript
{
  results: Array<{
    action: PageAction;
    success: boolean;
    error?: string;
    // Only if navigation occurred
    pageChanged?: {
      newUrl: string;
      newTitle: string;
    };
  }>;
  finalState: {
    url: string;
    title: string;
  };
  
  // Optional - only if there are errors
  errors?: PageError[];
}
```

### 7. puppeteer_click (Simple)

Click an element on the page.

**Options:**
```typescript
{
  selector: string;             // Required: CSS selector
}
```

### 8. puppeteer_fill (Simple)

Fill out an input field.

**Options:**
```typescript
{
  selector: string;             // Required: CSS selector
  value: string;                // Required: Value to fill
}
```

## Common Types

### PageError
```typescript
{
  type: "javascript" | "console" | "network" | "security";
  level: "error" | "warning" | "info";
  message: string;
  source?: string;
  line?: number;
  column?: number;
  timestamp: string;
  url?: string;
  statusCode?: number;
}
```

### ErrorSummary
```typescript
{
  totalErrors: number;
  totalWarnings: number;
  totalLogs: number;
  hasJavaScriptErrors: boolean;
  hasNetworkErrors: boolean;
  hasConsoleLogs: boolean;
}
```

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

### Navigate with Smart Defaults

```javascript
// Default: no content extraction for fastest response
await puppeteer_navigate_analyze({
  url: "https://example.com"
});

// Returns:
// {
//   url: "https://example.com",
//   statusCode: 200,
//   title: "Example Domain",
//   contentFormat: "none",
//   metadata: {
//     description: "Example Domain for use in examples"
//   }
// }

// With content extraction
await puppeteer_navigate_analyze({
  url: "https://example.com",
  contentFormat: "markdown"
});
// Returns with content field populated

// Truly minimal response
await puppeteer_navigate_analyze({
  url: "https://example.com",
  includeMetadata: false
});
// Returns only: url, statusCode, title, contentFormat
```

### Extract Content Efficiently

```javascript
// Structured JSON includes analysis by default
await puppeteer_extract_content({
  outputFormat: "structured-json"
});

// Returns:
// {
//   content: "{...json with headings, paragraphs...}",
//   contentFormat: "structured-json",
//   wordCount: 150,
//   analysis: {  // Included automatically for structured-json
//     headings: [...],
//     links: [...],
//     images: [...]
//   }
// }

// Markdown without analysis
await puppeteer_extract_content({
  outputFormat: "markdown",
  includeAnalysis: false  // Default for non-structured formats
});
```

### Capture Screenshots Optimized for LLMs

```javascript
// Default: resized for LLM processing
await puppeteer_screenshot_plus({
  name: "homepage",
  breakpoints: [375, 768, 1280],
  format: "jpeg",
  quality: 85
});
// Multiple screenshots: auto-resized to 2000×2000 max

// Single screenshot with custom limit
await puppeteer_screenshot_plus({
  name: "homepage",
  breakpoints: [1920], // Single breakpoint = 8000×8000 max by default
  resizeForLLM: true,
  maxDimension: 4096  // Custom max dimension
});

// Disable resizing for full quality
await puppeteer_screenshot_plus({
  name: "homepage",
  breakpoints: [1920],
  resizeForLLM: false  // Keep original size
});

// Use cut strategy (default) - crops image to fit
await puppeteer_screenshot_plus({
  name: "cropped",
  breakpoints: [1920],
  maxDimension: 800,
  resizeStrategy: "cut"  // Crops to 800x800 max
});

// Use resize strategy - scales down viewport
await puppeteer_screenshot_plus({
  name: "scaled",
  breakpoints: [1920],
  maxDimension: 800,
  resizeStrategy: "resize"  // Scales viewport to fit within 800px
});
```

### Analyze Page for SEO

```javascript
await puppeteer_get_page_info();

// Returns comprehensive analysis:
// - SEO assessment with specific issues
// - Accessibility metrics with scores
// - Performance indicators
// - Structured data detection
// - Complete meta tag analysis
```

### Execute Actions with Minimal Returns

```javascript
await puppeteer_batch_interact({
  actions: [
    { type: "type", selector: "#search", text: "puppeteer" },
    { type: "click", selector: "#search-button" },
    { type: "waitForSelector", selector: ".results", timeout: 5000 }
  ]
});

// Returns:
// - Success/failure for each action
// - Page changes only if navigation occurred
// - Final URL and title
// - Errors only if present
```

## Token Optimization Details

### Before vs After

**navigateAnalyze Before**: ~2,500 tokens average response
**navigateAnalyze After**: ~600 tokens (default with basic metadata), ~400 tokens (minimal)

**Key Optimizations:**
- Smart defaults: Basic metadata included, full details opt-in
- Removed processing stats (originalSizeBytes, reductionPercent)
- Eliminated content duplication (no raw HTML when markdown requested)
- Only essential metadata by default (description, ogImage)
- Performance metrics opt-in only
- Errors only included when present

**extractContent Before**: ~1,800 tokens average
**extractContent After**: ~300 tokens (minimal), ~600 tokens (with analysis)

**screenshotPlus Before**: ~1,200 tokens per screenshot
**screenshotPlus After**: ~150 tokens per screenshot

### Screenshot Resizing

Automatically resizes screenshots to comply with Claude.ai limits:
- **Single image**: Max 8000×8000 pixels
- **Multiple images**: Max 2000×2000 pixels per image
- Maintains aspect ratio when resizing
- Can be customized with `maxDimension` parameter

**Resize Strategies:**
- **"cut" (default)**: Crops the image to fit within max dimensions, keeping original viewport size
- **"resize"**: Scales down the viewport to fit within max dimensions, producing smaller file sizes

The "cut" strategy is preferred as it maintains the original page layout while ensuring the image fits within LLM limits. The "resize" strategy is useful when you need the entire page content visible but at a reduced scale.

### When to Use Options

**Default Behavior:**
- `navigateAnalyze`: Includes basic metadata (description, ogImage)
- `extractContent`: Includes analysis for structured-json format
- `getPageInfo`: Returns SEO and metadata sections

**Override Defaults:**
- `includeMetadata: false`: For truly minimal navigation
- `includePerformance: true`: For debugging performance issues
- `includeAnalysis: false`: Disable analysis for structured-json
- `sections: ['seo']`: Limit getPageInfo to specific sections

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
