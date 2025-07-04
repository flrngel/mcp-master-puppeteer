// Enhanced types with more descriptive return fields

import { PageError, ErrorSummary } from './index.js';

// Common types for content format options
export type ContentFormat = "markdown" | "html" | "plain-text" | "structured-json";

// Removed ContentProcessingInfo - not useful for agents

// Enhanced NavigateAnalyze types
export interface NavigateAnalyzeOptions {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle0" | "networkidle2";
  timeout?: number;
  contentFormat?: ContentFormat;
  includeMetadata?: boolean; // Only return basic navigation info + content unless true
  includePerformance?: boolean; // Skip performance metrics unless requested
}

export interface NavigateAnalyzeResult {
  // Always included - minimal essential data
  url: string; // Final URL after redirects
  statusCode: number;
  title: string;
  content: string; // In requested format
  contentFormat: ContentFormat; // What format the content is in
  
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

// Enhanced ExtractContent types
export interface ExtractContentOptions {
  selector?: string;
  includeHidden?: boolean;
  outputFormat?: ContentFormat;
  includeAnalysis?: boolean; // Include detailed structure analysis (headings, links, etc.)
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
  sections?: Array<"seo" | "accessibility" | "performance" | "metadata">; // Default: ["seo"]
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

// Enhanced BatchInteract types
export interface BatchInteractOptions {
  actions: any[]; // Keep existing PageAction type
  stopOnError?: boolean;
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
  }>;
  finalState: {
    url: string;
    title: string;
  };
  
  // Optional - only if there are errors
  errors?: PageError[];
}