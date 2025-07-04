// Common types for enhanced MCP Puppeteer tools

export interface PageError {
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

export interface ErrorSummary {
  totalErrors: number;
  totalWarnings: number;
  totalLogs: number;
  hasJavaScriptErrors: boolean;
  hasNetworkErrors: boolean;
  hasConsoleLogs: boolean;
}

export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string;
  ogTags: Record<string, string>;
  twitterTags: Record<string, string>;
  otherMeta: Record<string, string>;
}

export interface PageDimensions {
  viewport: { width: number; height: number };
  content: { width: number; height: number };
}

export interface PagePerformance {
  loadTime: number;
  timestamp: string;
  resourceCount: {
    images: number;
    scripts: number;
    stylesheets: number;
    total: number;
  };
}

export interface PageAction {
  type: "click" | "type" | "select" | "hover" | "wait" | "waitForSelector" | "scroll" | "clear" | "press";
  selector?: string;
  value?: string;
  text?: string;
  key?: string;
  duration?: number;
  timeout?: number;
  position?: { x: number; y: number };
}

export interface FormInfo {
  id?: string;
  name?: string;
  action?: string;
  method?: string;
  inputs: InputInfo[];
}

export interface InputInfo {
  type: string;
  name?: string;
  id?: string;
  value?: string;
  placeholder?: string;
  required: boolean;
  disabled: boolean;
  options?: Array<{ value: string; text: string }>;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: string;
    max?: string;
    pattern?: string;
  };
}

export interface ExtractedContent {
  title: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  links: Array<{ text: string; href: string; context?: string }>;
  images: Array<{ src: string; alt?: string; title?: string }>;
  tables: Array<{ markdown: string; summary?: string }>;
}

export interface NavigateAnalyzeResult {
  url: string;
  finalUrl: string;
  statusCode: number;
  statusText: string;
  redirectChain: string[];
  metadata: PageMetadata;
  contentPreview: string; // Markdown summary
  performance: PagePerformance;
  errors: PageError[];
  errorSummary: ErrorSummary;
}

export interface ScreenshotPlusResult {
  screenshots: Array<{
    breakpoint: number;
    image: string; // base64
    format: "png" | "jpeg";
    dimensions: PageDimensions;
    fileSize: number; // approximate size in bytes
  }>;
  performance: PagePerformance;
  errors: PageError[];
  errorSummary: ErrorSummary;
}