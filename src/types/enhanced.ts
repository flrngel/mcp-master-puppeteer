// Enhanced types with more descriptive return fields

import { PageError, ErrorSummary } from './index.js';

// Common types for content format options
export type ContentFormat = "markdown" | "html" | "plain-text" | "structured-json";

export interface ContentProcessingInfo {
  method: "turndown" | "raw" | "custom";
  options?: Record<string, any>;
  stats?: {
    originalSizeBytes: number;
    processedSizeBytes: number;
    reductionPercent: number;
  };
}

// Enhanced NavigateAnalyze types
export interface NavigateAnalyzeOptions {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  timeout?: number;
  contentFormat?: ContentFormat;
  includeRawHtml?: boolean;
}

export interface NavigateAnalyzeResult {
  navigationInfo: {
    originalUrl: string;
    finalUrl: string;
    statusCode: number;
    statusText: string;
    redirectChain: string[];
    navigationTimeMs: number;
  };
  content: {
    format: ContentFormat;
    data: string;
    rawHtml?: string; // Optional raw HTML if requested
    processing: ContentProcessingInfo;
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
    timings?: {
      domContentLoaded?: number;
      firstPaint?: number;
      firstContentfulPaint?: number;
    };
  };
  pageErrors: PageError[];
  errorSummary: ErrorSummary;
}

// Enhanced ExtractContent types
export interface ExtractContentOptions {
  selector?: string;
  includeHidden?: boolean;
  outputFormat?: ContentFormat;
  includeRawHtml?: boolean;
  preserveFormatting?: boolean;
}

export interface ExtractedContentResult {
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
      slug?: string; // URL-friendly version
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
      attributes?: Record<string, string>;
      surroundingContext?: string;
    }>;
    media: {
      images: Array<{
        sourceUrl: string;
        alternativeText?: string;
        title?: string;
        dimensions?: { width: number; height: number };
        fileType?: string;
        isDecorative: boolean;
      }>;
      videos: Array<{
        sourceUrl: string;
        type: string;
        poster?: string;
        duration?: number;
      }>;
      audioFiles: Array<{
        sourceUrl: string;
        type: string;
        duration?: number;
      }>;
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
  rawHtml?: string; // Optional raw HTML if requested
}

// Enhanced ScreenshotPlus types
export interface ScreenshotPlusOptions {
  name: string;
  breakpoints?: number[];
  selector?: string;
  fullPage?: boolean;
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  actions?: any[]; // Keep existing PageAction type
  optimizeForSize?: boolean;
  includeMetadata?: boolean;
}

export interface ScreenshotPlusResult {
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
      dataUrl: string;
      rawBase64: string;
    };
    imageDimensions: {
      capturedWidth: number;
      capturedHeight: number;
      viewportWidth: number;
      viewportHeight: number;
      fullPageHeight: number;
      aspectRatio: string; // "16:9", "4:3", etc.
    };
    imageMetrics: {
      fileSizeBytes: number;
      fileSizeFormatted: string; // "1.2 MB"
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

// Enhanced GetPageInfo types
export interface GetPageInfoResult {
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
      dublin: Record<string, string>; // Dublin Core
      other: Record<string, string>;
    };
    structuredData: {
      hasJsonLd: boolean;
      hasMicrodata: boolean;
      hasRDFa: boolean;
      schemas: string[];
      mainEntity?: string;
    };
  };
  seoAssessment: {
    titleAnalysis: {
      exists: boolean;
      content: string;
      lengthCharacters: number;
      lengthPixels?: number;
      isOptimal: boolean; // 30-60 chars
      issues: string[];
    };
    descriptionAnalysis: {
      exists: boolean;
      content?: string;
      lengthCharacters: number;
      isOptimal: boolean; // 120-160 chars
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
    colorContrast?: {
      sufficientContrast: boolean;
      issues: number;
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

// Enhanced AnalyzeForms types
export interface AnalyzeFormsResult {
  formAnalysisResults: {
    totalFormsFound: number;
    analyzedAt: string;
    pageUrl: string;
    forms: Array<{
      formIdentification: {
        index: number;
        id?: string;
        name?: string;
        cssSelector: string;
        xpath?: string;
      };
      formConfiguration: {
        actionUrl?: string;
        method: "GET" | "POST" | "PUT" | "DELETE" | "get" | "post" | "put" | "delete";
        enctype?: string;
        target?: string;
        autocomplete?: string;
        novalidate?: boolean;
      };
      detectedPurpose: {
        primaryPurpose: string | null; // "login", "registration", "search", "contact", "newsletter", "checkout", "survey", "comment"
        confidenceScore: number; // 0-100
        purposeIndicators: string[]; // what led to this detection
        secondaryPurposes?: string[];
      };
      fieldAnalysis: {
        totalFields: number;
        fieldsByType: Record<string, number>;
        requiredFields: number;
        optionalFields: number;
        hiddenFields: number;
        fields: Array<{
          fieldIdentification: {
            type: string;
            name?: string;
            id?: string;
            cssSelector: string;
          };
          fieldProperties: {
            isRequired: boolean;
            isDisabled: boolean;
            isReadonly: boolean;
            isHidden: boolean;
            defaultValue?: string;
            placeholder?: string;
          };
          validationRules: {
            html5Validation: {
              minLength?: number;
              maxLength?: number;
              min?: string;
              max?: string;
              pattern?: string;
              step?: string;
              type?: string;
            };
            customValidation: {
              hasJavaScriptValidation: boolean;
              validationLibrary?: string;
            };
          };
          accessibility: {
            hasLabel: boolean;
            labelText?: string;
            hasAriaLabel: boolean;
            ariaLabelText?: string;
            hasAriaDescribedBy: boolean;
            hasPlaceholder: boolean;
            describedByError: boolean;
            describedByHelp: boolean;
          };
          relatedElements?: {
            errorMessageId?: string;
            helpTextId?: string;
            labelId?: string;
          };
        }>;
      };
      securityFeatures: {
        hasCSRFToken: boolean;
        csrfFieldName?: string;
        hasHoneypot: boolean;
        honeypotFieldName?: string;
        hasCaptcha: boolean;
        captchaType?: string; // "recaptcha", "hcaptcha", "custom"
        hasRateLimiting?: boolean;
      };
      usabilityMetrics: {
        estimatedCompletionTime: number; // seconds
        fieldGrouping: boolean;
        hasProgressIndicator: boolean;
        hasInlineValidation: boolean;
        mobileOptimized: boolean;
      };
    }>;
  };
  aggregateStatistics: {
    formTypes: Record<string, number>;
    commonFieldTypes: Array<{ type: string; count: number; percentage: number }>;
    averageFieldsPerForm: number;
    accessibilityScore: number; // 0-100
    securityScore: number; // 0-100
    usabilityScore: number; // 0-100
    overallQualityScore: number; // 0-100
    commonIssues: Array<{
      issue: string;
      severity: "low" | "medium" | "high";
      count: number;
      recommendation: string;
    }>;
  };
}

// Enhanced BatchInteract types
export interface BatchInteractOptions {
  actions: any[]; // Keep existing PageAction type
  stopOnError?: boolean;
  captureStateAfterEach?: boolean;
  timeoutPerAction?: number;
  delayBetweenActions?: number;
}

export interface BatchInteractResult {
  executionSummary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    skippedActions: number;
    executionTimeMs: number;
    averageActionTimeMs: number;
    stoppedEarly: boolean;
    stopReason?: string;
  };
  actionResults: Array<{
    actionIndex: number;
    actionDescription: {
      type: string;
      target?: string;
      value?: string;
      humanReadable: string; // "Clicked button#submit"
      technicalDetails: Record<string, any>;
    };
    executionResult: {
      status: "success" | "failed" | "skipped" | "timeout";
      executionTimeMs: number;
      attempts: number;
      error?: {
        code: string;
        message: string;
        technicalMessage?: string;
        suggestion?: string;
        selector?: string;
      };
    };
    pageStateChange?: {
      urlChanged: boolean;
      previousUrl?: string;
      currentUrl: string;
      titleChanged: boolean;
      previousTitle?: string;
      currentTitle: string;
      navigationOccurred: boolean;
      significantDOMChanges: boolean;
    };
    capturedState?: {
      timestamp: string;
      readyState: string;
      isLoading: boolean;
      activeElement?: string;
      scrollPosition: { x: number; y: number };
      viewportSize: { width: number; height: number };
      consoleMessages?: Array<{
        level: "log" | "info" | "warn" | "error";
        message: string;
        timestamp: string;
        source?: string;
      }>;
      networkActivity?: {
        requestsInitiated: number;
        requestsCompleted: number;
        requestsFailed: number;
        totalBandwidth?: number;
      };
      performanceTiming?: {
        domContentLoaded: boolean;
        loadEventFired: boolean;
      };
    };
  }>;
  finalPageState: {
    url: string;
    title: string;
    readyState: string;
    totalNavigations: number;
    hasUnexpectedChanges: boolean;
    significantChanges: Array<{
      type: string;
      description: string;
      impact: "low" | "medium" | "high";
    }>;
    possibleIssues: string[];
  };
  errors: PageError[];
  errorSummary: ErrorSummary;
}