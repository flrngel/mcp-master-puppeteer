// Enhanced types with more descriptive return fields

import { PageError, ErrorSummary } from './index.js';

// Common types for content format options
export type ContentFormat = "none" | "markdown" | "html" | "plain-text" | "structured-json";

// Removed ContentProcessingInfo - not useful for agents

// Enhanced NavigateAnalyze types
export interface NavigateAnalyzeOptions {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  timeout?: number;
  contentFormat?: ContentFormat;
  includeMetadata?: boolean; // Include basic metadata - description, ogImage (default: true)
  includePerformance?: boolean; // Include performance metrics (default: false)
  includeDomTree?: boolean; // Include DOM tree with interactive elements (default: false)
  domTreeOptions?: {
    showHighlightElements?: boolean; // Show visual highlights on page (default: false)
    viewportExpansion?: number; // Pixels to expand viewport for element detection (default: 0, -1 for all)
  };
  includeAllErrors?: boolean; // Include all errors including dev/analytics noise (default: false)
}

export interface NavigateAnalyzeResult {
  // Always included - minimal essential data
  url: string; // Final URL after redirects
  statusCode: number;
  title: string;
  content?: string; // In requested format (omitted if contentFormat is "none")
  contentFormat: ContentFormat; // What format the content is in
  
  // Optional - only if there are errors
  errors?: PageError[];
  
  // Optional - basic metadata included by default (set includeMetadata: false to omit)
  metadata?: {
    description?: string;
    ogImage?: string;
    redirectChain?: string[];
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
  
  // Optional - only if includeDomTree is true
  domTree?: {
    elements: Array<{
      index: number; // Unique index for selection
      tag: string; // HTML tag name
      text?: string; // Visible text (truncated to 50 chars)
      href?: string; // For links
      type?: string; // For inputs/buttons
      name?: string; // Form element name
      value?: string; // Current value
      placeholder?: string; // Input placeholder
    }>;
    count: number; // Total interactive elements
  };
}

// Enhanced ExtractContent types
export interface ExtractContentOptions {
  selector?: string;
  includeHidden?: boolean;
  outputFormat?: ContentFormat;
  includeAnalysis?: boolean; // Include structure analysis (default: true for structured-json)
  includeDomTree?: boolean; // Include DOM tree with interactive elements (default: false)
  domTreeOptions?: {
    showHighlightElements?: boolean; // Show visual highlights on page (default: false)
    viewportExpansion?: number; // Pixels to expand viewport for element detection (default: 0, -1 for all)
  };
}

export interface ExtractedContentResult {
  // Always included - the extracted content
  content: string; // In requested format
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
    tables: number; // Just count
    lists: {
      ordered: number;
      unordered: number;
    };
  };
  
  // Optional - only if includeDomTree is true
  domTree?: {
    elements: Array<{
      index: number; // Unique index for selection
      tag: string; // HTML tag name
      text?: string; // Visible text (truncated to 50 chars)
      href?: string; // For links
      type?: string; // For inputs/buttons
      name?: string; // Form element name
      value?: string; // Current value
      placeholder?: string; // Input placeholder
    }>;
    count: number; // Total interactive elements
  };
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
  resizeForLLM?: boolean; // Resize to stay under max dimension limit (default: true)
  maxDimension?: number; // Maximum width or height in pixels (default: 8000 for single, 2000 for multiple)
  resizeStrategy?: "cut" | "resize"; // Strategy for handling oversized images (default: "cut")
}

export interface ScreenshotPlusResult {
  screenshots: Array<{
    viewport: { width: number; height: number };
    dataUrl: string; // Complete data URL ready to use
    format: "png" | "jpeg" | "webp";
    dimensions: {
      width: number;
      height: number;
      aspectRatio: string; // "16:9", "4:3", etc.
    };
    fullPage: boolean;
  }>;
  
  // Optional - only if there are errors
  errors?: PageError[];
}

// Enhanced GetPageInfo types
export interface GetPageInfoOptions {
  sections?: Array<"seo" | "accessibility" | "performance" | "metadata">; // Default: ["seo", "metadata"]
}

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

// Enhanced AnalyzeForms types - Keep original, it's already focused

// Navigation info structure for when navigation occurs
export interface NavigationInfo {
  fromUrl: string;
  toUrl: string;
  statusCode?: number;
  redirectChain?: string[];
  title: string;
  navigationTimeMs?: number;
}

// Enhanced BatchInteract types
export interface BatchInteractOptions {
  actions: any[]; // Keep existing PageAction type
  stopOnError?: boolean;
  preventNavigation?: boolean; // Prevent any navigation from occurring (default: false)
  returnNavigationInfo?: boolean; // Return detailed navigation info when navigation occurs (default: true)
}

export interface BatchInteractResult {
  results: Array<{
    action: any; // Original action
    success: boolean;
    error?: string;
    // Only include state change if navigation occurred
    pageChanged?: {
      newUrl: string;
      newTitle: string;
    };
    // Detailed navigation info if returnNavigationInfo is true
    navigationInfo?: NavigationInfo;
  }>;
  finalState: {
    url: string;
    title: string;
  };
  
  // Optional - only if there are errors
  errors?: PageError[];
  
  // Optional - included if any navigation was prevented
  navigationsPrevented?: number;
}