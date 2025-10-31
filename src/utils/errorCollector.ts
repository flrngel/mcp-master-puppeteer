import { Page } from 'puppeteer';
import { PageError, ErrorSummary } from '../types/index.js';

export class ErrorCollector {
  private errors: PageError[] = [];
  private page: Page;
  private listeners: Map<string, any> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  async start(): Promise<void> {
    // Collect JavaScript errors
    const pageErrorHandler = (error: Error) => {
      this.errors.push({
        type: "javascript",
        level: "error",
        message: error.message,
        source: error.stack?.split('\n')[1]?.trim() || '',
        timestamp: new Date().toISOString()
      });
    };
    this.page.on('pageerror', pageErrorHandler);
    this.listeners.set('pageerror', pageErrorHandler);

    // Collect console messages
    const consoleHandler = (msg: any) => {
      const type = msg.type();
      let level: "error" | "warning" | "info";
      
      if (type === 'error' || type === 'assert') {
        level = "error";
      } else if (type === 'warning' || type === 'warn') {
        level = "warning";
      } else {
        level = "info";
      }

      const location = msg.location();
      this.errors.push({
        type: "console",
        level,
        message: msg.text(),
        source: location?.url,
        line: location?.lineNumber,
        column: location?.columnNumber,
        timestamp: new Date().toISOString()
      });
    };
    this.page.on('console', consoleHandler);
    this.listeners.set('console', consoleHandler);

    // Collect network failures
    const responseHandler = (response: any) => {
      if (!response.ok() && response.status() !== 304) { // 304 Not Modified is ok
        this.errors.push({
          type: "network",
          level: response.status() >= 500 ? "error" : "warning",
          message: `HTTP ${response.status()} ${response.statusText()}`,
          url: response.url(),
          statusCode: response.status(),
          timestamp: new Date().toISOString()
        });
      }
    };
    this.page.on('response', responseHandler);
    this.listeners.set('response', responseHandler);

    // Collect request failures
    const requestFailedHandler = (request: any) => {
      const failure = request.failure();
      if (failure) {
        this.errors.push({
          type: failure.errorText.includes('CORS') ? "security" : "network",
          level: "error",
          message: failure.errorText,
          url: request.url(),
          timestamp: new Date().toISOString()
        });
      }
    };
    this.page.on('requestfailed', requestFailedHandler);
    this.listeners.set('requestfailed', requestFailedHandler);
  }

  stop(): void {
    // Remove all listeners
    for (const [event, handler] of this.listeners) {
      this.page.off(event, handler);
    }
    this.listeners.clear();
  }

  getErrors(filterNoise: boolean = true): PageError[] {
    let errors = [...this.errors];

    if (filterNoise) {
      errors = errors.filter(error => {
        // Filter out development/debugging noise
        const message = error.message.toLowerCase();

        // Skip React DevTools, HMR, Fast Refresh
        if (message.includes('react devtools') ||
            message.includes('[hmr]') ||
            message.includes('[fast refresh]')) {
          return false;
        }

        // Skip analytics/tracking (GA4, session telemetry, etc.)
        if (message.includes('analytics') ||
            message.includes('ga4 event') ||
            message.includes('[sessiontelemetry]')) {
          return false;
        }

        // Skip console.info unless it's actually useful
        if (error.level === 'info') {
          // Keep info logs that might be errors
          if (message.includes('error') ||
              message.includes('failed') ||
              message.includes('warning')) {
            return true;
          }
          return false; // Skip all other info logs
        }

        // Skip expected auth failures (401 on auth/session endpoints)
        if (error.type === 'network' && error.statusCode === 401) {
          const url = error.url || '';
          if (url.includes('/auth/') || url.includes('/api/auth')) {
            return false;
          }
        }

        // Skip failed analytics/tracking requests
        if (error.type === 'network' && error.url) {
          const url = error.url.toLowerCase();
          if (url.includes('google-analytics') ||
              url.includes('googletagmanager') ||
              url.includes('.doubleclick.net') ||
              url.includes('analytics.')) {
            return false;
          }
        }

        return true;
      });
    }

    return errors;
  }

  getSummary(): ErrorSummary {
    const errors = this.errors.filter(e => e.level === 'error');
    const warnings = this.errors.filter(e => e.level === 'warning');
    const logs = this.errors.filter(e => e.level === 'info');

    return {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      totalLogs: logs.length,
      hasJavaScriptErrors: errors.some(e => e.type === 'javascript'),
      hasNetworkErrors: errors.some(e => e.type === 'network'),
      hasConsoleLogs: logs.some(e => e.type === 'console')
    };
  }

  clear(): void {
    this.errors = [];
  }
}