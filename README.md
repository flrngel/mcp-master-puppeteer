# MCP Master Puppeteer

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

Navigate to a URL and return comprehensive page analysis with metadata, content in your preferred format, and performance metrics.

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
  content: string;                // In requested format
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

Take screenshots with detailed metadata including dimensions, file sizes, and capture settings.

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

### Navigate with Format Options

```javascript
// Get markdown summary
await puppeteer_navigate_analyze({
  url: "https://example.com",
  contentFormat: "markdown",
  includeRawHtml: false
});

// Returns comprehensive data with:
// - Navigation details and redirects
// - Content in markdown format with processing stats
// - Page metadata (title, description, OG tags)
// - Performance metrics and resource counts
// - All errors encountered during navigation
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
// - Links with validation and context
// - Images with accessibility info
// - Tables as markdown
// - Detailed extraction metadata
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
// - Any errors during capture
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
**navigateAnalyze After**: ~400 tokens (minimal), ~800 tokens (with metadata)

**Key Optimizations:**
- Removed processing stats (originalSizeBytes, reductionPercent)
- Eliminated content duplication (no raw HTML when markdown requested)
- Made metadata optional (OG tags, Twitter cards, etc.)
- Performance metrics opt-in only
- Errors only included when present

**extractContent Before**: ~1,800 tokens average
**extractContent After**: ~300 tokens (minimal), ~600 tokens (with analysis)

**screenshotPlus Before**: ~1,200 tokens per screenshot
**screenshotPlus After**: ~150 tokens per screenshot

### When to Use Options

- `includeMetadata`: When you need SEO data or social media tags
- `includePerformance`: For performance debugging
- `includeAnalysis`: When you need document structure (headings, links)
- Default (no options): For simple content extraction or navigation

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