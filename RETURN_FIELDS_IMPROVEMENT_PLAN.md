# Return Fields Improvement Plan

## Current Issues

1. **Unclear Format Indicators**: When returning markdown, we don't indicate it's processed
2. **Missing Processing Metadata**: No information about what transformations were applied
3. **Lack of Options**: Can't choose between raw HTML and processed markdown
4. **Ambiguous Field Names**: Fields like `contentPreview` don't clearly indicate format

## Proposed Improvements

### 1. NavigateAnalyze Tool

**Current**:
```typescript
{
  contentPreview: string; // Markdown but not indicated
  metadata: PageMetadata;
  performance: PagePerformance;
}
```

**Improved**:
```typescript
{
  content: {
    format: "markdown" | "html";
    data: string;
    processing: {
      method: "turndown" | "raw";
      options?: { headingStyle?: string; codeBlockStyle?: string };
    };
    stats: {
      originalSize: number;
      processedSize: number;
      reductionPercent: number;
    };
  };
  pageMetadata: {
    title: string;
    description?: string;
    openGraph: Record<string, string>;
    twitter: Record<string, string>;
    other: Record<string, string>;
  };
  performanceMetrics: {
    loadTimeMs: number;
    timestamp: string;
    resourceCounts: {
      images: number;
      scripts: number;
      stylesheets: number;
      total: number;
    };
  };
  navigationInfo: {
    originalUrl: string;
    finalUrl: string;
    statusCode: number;
    statusText: string;
    redirectChain: string[];
  };
}
```

### 2. ExtractContent Tool

**Current**:
```typescript
{
  title: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  links: Array<{ text: string; href: string; context?: string }>;
}
```

**Improved**:
```typescript
{
  extractionMetadata: {
    sourceFormat: "html";
    extractedAt: string;
    selector?: string;
    includeHidden: boolean;
  };
  structuredContent: {
    documentTitle: string;
    headingHierarchy: Array<{
      level: 1 | 2 | 3 | 4 | 5 | 6;
      text: string;
      id?: string;
    }>;
    textContent: {
      paragraphs: Array<{
        text: string;
        wordCount: number;
        position: number;
      }>;
      totalWordCount: number;
    };
    hyperlinks: Array<{
      displayText: string;
      targetUrl: string;
      isExternal: boolean;
      surroundingContext?: string;
    }>;
    media: {
      images: Array<{
        sourceUrl: string;
        alternativeText?: string;
        title?: string;
        dimensions?: { width: number; height: number };
      }>;
      videos: Array<{ sourceUrl: string; type: string }>;
    };
    tables: Array<{
      format: "markdown" | "json";
      data: string | object;
      dimensions: { rows: number; columns: number };
      hasHeaders: boolean;
    }>;
  };
  conversionOptions?: {
    outputFormat: "markdown" | "plain-text" | "structured-json";
    preserveFormatting: boolean;
    includeMetadata: boolean;
  };
}
```

### 3. ScreenshotPlus Tool

**Current**:
```typescript
{
  screenshots: Array<{
    breakpoint: number;
    image: string;
    format: string;
    dimensions: PageDimensions;
    fileSize: number;
  }>;
}
```

**Improved**:
```typescript
{
  screenshotResults: Array<{
    viewportWidth: number;
    imageData: {
      format: "png" | "jpeg" | "webp";
      encoding: "base64";
      dataUrl: string;
      rawBase64: string;
    };
    imageDimensions: {
      capturedWidth: number;
      capturedHeight: number;
      viewportWidth: number;
      viewportHeight: number;
      fullPageHeight: number;
    };
    imageMetrics: {
      fileSizeBytes: number;
      fileSizeFormatted: string; // "1.2 MB"
      compressionQuality?: number;
      isOptimized: boolean;
    };
    captureSettings: {
      fullPage: boolean;
      selector?: string;
      timestamp: string;
    };
  }>;
  captureMetadata: {
    totalCaptureTimeMs: number;
    actionsPerformed: string[];
    pageStateBeforeCapture: {
      url: string;
      title: string;
      readyState: string;
    };
  };
}
```

### 4. GetPageInfo Tool

**Current**:
```typescript
{
  url: string;
  title: string;
  metadata: PageMetadata;
  seo: { hasTitle: boolean; ... };
}
```

**Improved**:
```typescript
{
  pageIdentification: {
    currentUrl: string;
    canonicalUrl?: string;
    title: string;
    language?: string;
  };
  metadataAnalysis: {
    metaTags: {
      basic: { description?: string; keywords?: string; author?: string };
      openGraph: Record<string, string>;
      twitterCard: Record<string, string>;
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
      length: number;
      isOptimal: boolean; // 30-60 chars
    };
    descriptionAnalysis: {
      exists: boolean;
      length: number;
      isOptimal: boolean; // 120-160 chars
    };
    headingStructure: {
      hasH1: boolean;
      h1Count: number;
      isHierarchical: boolean;
    };
    canonicalStatus: {
      hasCanonical: boolean;
      isSelfreferencing: boolean;
    };
  };
  accessibilityMetrics: {
    language: {
      hasLangAttribute: boolean;
      declaredLanguage?: string;
    };
    landmarks: {
      hasMain: boolean;
      hasNav: boolean;
      hasHeader: boolean;
      landmarkRoles: string[];
    };
    imageAccessibility: {
      totalImages: number;
      imagesWithAlt: number;
      altTextCoverage: number; // percentage
      decorativeImages: number;
    };
  };
}
```

### 5. AnalyzeForms Tool

**Current**:
```typescript
{
  formCount: number;
  forms: FormInfo[];
  summary: { ... };
}
```

**Improved**:
```typescript
{
  formAnalysisResults: {
    totalFormsFound: number;
    analyzedAt: string;
    forms: Array<{
      formIdentification: {
        index: number;
        id?: string;
        name?: string;
        cssSelector: string;
      };
      formConfiguration: {
        actionUrl?: string;
        method: "GET" | "POST" | "PUT" | "DELETE";
        enctype?: string;
        target?: string;
      };
      detectedPurpose: {
        primaryPurpose: string | null; // "login", "registration", etc.
        confidenceScore: number; // 0-100
        purposeIndicators: string[]; // what led to this detection
      };
      fieldAnalysis: {
        totalFields: number;
        fieldsByType: Record<string, number>;
        requiredFields: number;
        fields: Array<{
          fieldType: string;
          fieldName?: string;
          fieldId?: string;
          isRequired: boolean;
          validationRules: {
            minLength?: number;
            maxLength?: number;
            pattern?: string;
            min?: string;
            max?: string;
            customValidation?: boolean;
          };
          accessibility: {
            hasLabel: boolean;
            hasAriaLabel: boolean;
            hasPlaceholder: boolean;
          };
        }>;
      };
      securityFeatures: {
        hasCSRFToken: boolean;
        hasHoneypot: boolean;
        hasCaptcha: boolean;
      };
    }>;
  };
  aggregateStatistics: {
    commonFieldTypes: Record<string, number>;
    averageFieldsPerForm: number;
    accessibilityScore: number; // 0-100
    detectedFormPurposes: Record<string, number>;
  };
}
```

### 6. BatchInteract Tool

**Current**:
```typescript
{
  results: ActionResult[];
  finalState: { url: string; title: string };
}
```

**Improved**:
```typescript
{
  executionSummary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    executionTimeMs: number;
    stoppedEarly: boolean;
  };
  actionResults: Array<{
    actionIndex: number;
    actionDescription: {
      type: string;
      target?: string;
      value?: string;
      humanReadable: string; // "Clicked button#submit"
    };
    executionResult: {
      status: "success" | "failed" | "skipped";
      executionTimeMs: number;
      error?: {
        code: string;
        message: string;
        suggestion?: string;
      };
    };
    pageStateAfter?: {
      url: string;
      title: string;
      readyState: string;
      consoleMessages?: Array<{
        level: string;
        message: string;
        timestamp: string;
      }>;
      networkActivity?: {
        requestsInitiated: number;
        requestsCompleted: number;
      };
    };
  }>;
  finalPageState: {
    url: string;
    title: string;
    hasUnexpectedChanges: boolean;
    significantChanges: string[]; // ["URL changed", "New form appeared"]
  };
}
```

## Implementation Approach

1. **Add Format Options**: All content-returning tools should accept format options
2. **Include Processing Metadata**: Show what transformations were applied
3. **Use Descriptive Nested Objects**: Group related data with clear names
4. **Add Statistics**: Include counts, percentages, and analysis scores
5. **Provide Human-Readable Descriptions**: Include both technical and friendly descriptions
6. **Version Return Schemas**: Consider adding version field for future compatibility