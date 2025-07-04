# MCP Master Puppeteer

An advanced MCP (Model Context Protocol) server for browser automation using Puppeteer, designed with rich data returns and minimal tool chaining.

## Features

### 🎯 Enhanced Tools with Descriptive Returns

Each tool returns comprehensive, self-documenting data:

- **Clear Format Indicators**: Know exactly what format your content is in (markdown, HTML, JSON)
- **Processing Metadata**: See what transformations were applied to the data
- **Descriptive Field Names**: Nested objects group related data logically
- **Rich Statistics**: Word counts, file sizes, dimensions, and more

### 🚀 Key Design Principles

1. **Minimize Tool Chaining**: Each tool returns all relevant data in one call
2. **Self-Documenting Returns**: Field names clearly indicate content and format
3. **Token Efficiency**: Markdown conversion reduces token usage vs raw HTML
4. **Error Transparency**: Comprehensive error collection and categorization

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
  includeRawHtml?: boolean;       // Include raw HTML in addition to formatted content (default: false)
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
  content: {
    format: "markdown" | "html" | "plain-text";
    data: string;
    rawHtml?: string;  // If includeRawHtml is true
    processing: {
      method: "turndown" | "raw" | "custom";
      stats?: {
        originalSizeBytes: number;
        processedSizeBytes: number;
        reductionPercent: number;
      };
    };
  };
  pageMetadata: {
    title: string;
    description?: string;
    keywords?: string;
    openGraph: Record<string, string>;
    twitterCard: Record<string, string>;
    otherMeta: Record<string, string>;
  };
  performanceMetrics: {
    loadTimeMs: number;
    timestamp: string;
    resourceCounts: {
      images: number;
      scripts: number;
      stylesheets: number;
      fonts: number;
      total: number;
    };
  };
  pageErrors: PageError[];
  errorSummary: ErrorSummary;
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
  optimizeForSize?: boolean;      // Optimize for smaller file size (default: true)
  includeMetadata?: boolean;      // Include browser metadata (default: true)
}
```

**Returns:**
```typescript
{
  screenshotResults: Array<{
    viewportConfiguration: {
      width: number;
      height: number;
      deviceScaleFactor?: number;
    };
    imageData: {
      format: "png" | "jpeg" | "webp";
      encoding: "base64";
      mimeType: string;
      dataUrl: string;         // Full data URL ready for use
      rawBase64: string;       // Just the base64 data
    };
    imageDimensions: {
      capturedWidth: number;
      capturedHeight: number;
      viewportWidth: number;
      viewportHeight: number;
      fullPageHeight: number;
      aspectRatio: string;     // e.g., "16:9"
    };
    imageMetrics: {
      fileSizeBytes: number;
      fileSizeFormatted: string;  // e.g., "1.2 MB"
      compressionQuality?: number;
      isOptimized: boolean;
      colorDepth?: number;
    };
    captureSettings: {
      fullPage: boolean;
      selector?: string;
      timestamp: string;
      captureTimeMs: number;
    };
  }>;
  captureMetadata: {
    totalCaptureTimeMs: number;
    actionsPerformed: Array<{
      type: string;
      description: string;
      success: boolean;
    }>;
    pageStateBeforeCapture: {
      url: string;
      title: string;
      readyState: string;
      scrollPosition: { x: number; y: number };
    };
    browserInfo?: {
      userAgent: string;
      viewport: string;
    };
  };
  errors: PageError[];
  errorSummary: ErrorSummary;
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
  includeRawHtml?: boolean;       // Include raw HTML (default: false)
  preserveFormatting?: boolean;   // Preserve original formatting (default: true)
}
```

**Returns:**
```typescript
{
  extractionMetadata: {
    sourceFormat: "html";
    extractedAt: string;
    selector?: string;
    includeHidden: boolean;
    documentUrl: string;
  };
  structuredContent: {
    documentTitle: string;
    headingHierarchy: Array<{
      level: 1 | 2 | 3 | 4 | 5 | 6;
      text: string;
      id?: string;
      slug?: string;           // URL-friendly version
    }>;
    textContent: {
      paragraphs: Array<{
        text: string;
        wordCount: number;
        characterCount: number;
        position: number;
      }>;
      totalWordCount: number;
      totalCharacterCount: number;
      estimatedReadingTimeSeconds: number;
    };
    hyperlinks: Array<{
      displayText: string;
      targetUrl: string;
      isExternal: boolean;
      isValid: boolean;
      surroundingContext?: string;
    }>;
    media: {
      images: Array<{
        sourceUrl: string;
        alternativeText?: string;
        title?: string;
        isDecorative: boolean;
      }>;
      videos: Array<{ sourceUrl: string; type: string; }>;
      audioFiles: Array<{ sourceUrl: string; type: string; }>;
    };
    tables: Array<{
      format: "markdown" | "json" | "csv";
      data: string | object;
      dimensions: { rows: number; columns: number };
      hasHeaders: boolean;
      caption?: string;
    }>;
    lists: {
      ordered: Array<{ items: string[]; depth: number }>;
      unordered: Array<{ items: string[]; depth: number }>;
    };
  };
  formattedContent?: {
    format: ContentFormat;
    data: string;
    processing: ContentProcessingInfo;
  };
  rawHtml?: string;  // If includeRawHtml is true
}
```

### 4. puppeteer_get_page_info

Get comprehensive page metadata, SEO assessment, accessibility metrics, and performance indicators.

**Options:**
```typescript
// No options - analyzes the current page
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
  captureStateAfterEach?: boolean;  // Capture state after each action (default: false)
}
```

**Returns:**
```typescript
{
  results: Array<{
    action: PageAction;
    success: boolean;
    error?: string;
    pageState?: {
      url: string;
      title: string;
      consoleLogs?: string[];
    };
  }>;
  finalState: {
    url: string;
    title: string;
  };
  errors: PageError[];
  errorSummary: ErrorSummary;
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

### Execute Complex Interactions

```javascript
await puppeteer_batch_interact({
  actions: [
    { type: "type", selector: "#search", text: "puppeteer" },
    { type: "click", selector: "#search-button" },
    { type: "waitForSelector", selector: ".results", timeout: 5000 }
  ],
  captureStateAfterEach: true
});

// Returns:
// - Success/failure for each action
// - Page state changes after each step
// - Console logs captured during execution
// - Final page state
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