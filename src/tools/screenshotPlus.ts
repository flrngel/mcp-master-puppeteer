import { getPage, executePageActions } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { getPageDimensions, analyzePagePerformance } from '../utils/pageAnalyzer.js';
import { ScreenshotPlusOptions, ScreenshotPlusResult } from '../types/enhanced.js';

const DEFAULT_BREAKPOINTS = [375, 768, 1280]; // Mobile, Tablet, Desktop

export async function screenshotPlus(args: ScreenshotPlusOptions): Promise<ScreenshotPlusResult> {
  const {
    name,
    breakpoints = DEFAULT_BREAKPOINTS,
    selector,
    fullPage = true,
    format = 'jpeg',
    quality = 80,
    actions = [],
    optimizeForSize = true,
    includeMetadata = true
  } = args;
  
  const page = await getPage();
  const errorCollector = new ErrorCollector(page);
  const screenshotResults = [];
  const totalStartTime = Date.now();
  const actionsPerformed: any[] = [];
  
  try {
    // Start error collection
    await errorCollector.start();
    
    // Get initial page state
    const pageStateBeforeCapture = {
      url: page.url(),
      title: await page.title(),
      readyState: await page.evaluate(() => document.readyState),
      scrollPosition: await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))
    };
    
    // Execute any actions before screenshot
    if (actions.length > 0) {
      for (const action of actions) {
        const actionStart = Date.now();
        let success = true;
        let description = '';
        
        try {
          await executePageActions(page, [action]);
          description = getActionDescription(action);
        } catch (error) {
          success = false;
          description = `Failed: ${getActionDescription(action)}`;
        }
        
        actionsPerformed.push({
          type: action.type,
          description,
          success,
          executionTimeMs: Date.now() - actionStart
        });
      }
    }
    
    // Take screenshots at each breakpoint
    for (const breakpoint of breakpoints) {
      const captureStart = Date.now();
      
      // Set viewport
      await page.setViewport({
        width: breakpoint,
        height: 800 // Default height, will capture full page
      });
      
      // Wait for any viewport-based changes to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get dimensions
      const dimensions = await getPageDimensions(page);
      
      // Configure screenshot options
      const screenshotOptions: any = {
        encoding: 'base64',
        fullPage: fullPage && !selector,
        type: format
      };
      
      if (format === 'jpeg' && optimizeForSize) {
        screenshotOptions.quality = quality;
      } else if (format === 'jpeg') {
        screenshotOptions.quality = 100; // Max quality if not optimizing
      }
      
      // Take screenshot
      let screenshot: string;
      if (selector) {
        const element = await page.$(selector);
        if (!element) {
          throw new Error(`Element not found: ${selector}`);
        }
        screenshot = await element.screenshot(screenshotOptions) as string;
      } else {
        screenshot = await page.screenshot(screenshotOptions) as string;
      }
      
      // Calculate file size
      const fileSizeBytes = Math.round((screenshot.length * 3) / 4);
      const fileSizeFormatted = formatFileSize(fileSizeBytes);
      
      // Calculate aspect ratio
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const aspectGcd = gcd(dimensions.content.width, dimensions.content.height);
      const aspectRatio = `${dimensions.content.width / aspectGcd}:${dimensions.content.height / aspectGcd}`;
      
      screenshotResults.push({
        viewportConfiguration: {
          width: breakpoint,
          height: 800,
          deviceScaleFactor: 1
        },
        imageData: {
          format,
          encoding: 'base64' as const,
          mimeType: `image/${format}`,
          dataUrl: `data:image/${format};base64,${screenshot}`,
          rawBase64: screenshot
        },
        imageDimensions: {
          capturedWidth: fullPage ? dimensions.content.width : Math.min(dimensions.content.width, breakpoint),
          capturedHeight: fullPage ? dimensions.content.height : Math.min(dimensions.content.height, 800),
          viewportWidth: breakpoint,
          viewportHeight: 800,
          fullPageHeight: dimensions.content.height,
          aspectRatio
        },
        imageMetrics: {
          fileSizeBytes,
          fileSizeFormatted,
          compressionQuality: format === 'jpeg' ? quality : undefined,
          isOptimized: optimizeForSize,
          colorDepth: format === 'png' ? 32 : 24
        },
        captureSettings: {
          fullPage,
          selector,
          timestamp: new Date().toISOString(),
          captureTimeMs: Date.now() - captureStart
        }
      });
    }
    
    // Get browser info if metadata requested
    let browserInfo;
    if (includeMetadata) {
      browserInfo = {
        userAgent: await page.evaluate(() => navigator.userAgent),
        viewport: `${page.viewport()?.width}x${page.viewport()?.height}`
      };
    }
    
    // Stop error collection
    errorCollector.stop();
    
    const result: ScreenshotPlusResult = {
      screenshotResults,
      captureMetadata: {
        totalCaptureTimeMs: Date.now() - totalStartTime,
        actionsPerformed,
        pageStateBeforeCapture,
        ...(browserInfo ? { browserInfo } : {})
      },
      errors: errorCollector.getErrors(),
      errorSummary: errorCollector.getSummary()
    };
    
    return result;
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}

function getActionDescription(action: any): string {
  switch (action.type) {
    case 'click':
      return `Clicked element: ${action.selector}`;
    case 'type':
      return `Typed "${action.text || action.value}" into ${action.selector}`;
    case 'select':
      return `Selected "${action.value}" in ${action.selector}`;
    case 'hover':
      return `Hovered over ${action.selector}`;
    case 'scroll':
      if (action.position) {
        return `Scrolled to position (${action.position.x}, ${action.position.y})`;
      }
      return action.selector ? `Scrolled to ${action.selector}` : 'Scrolled page';
    case 'wait':
      return `Waited for ${action.duration || 1000}ms`;
    case 'waitForSelector':
      return `Waited for element: ${action.selector}`;
    case 'clear':
      return `Cleared field: ${action.selector}`;
    case 'press':
      return `Pressed key: ${action.key}`;
    default:
      return `Performed ${action.type} action`;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}