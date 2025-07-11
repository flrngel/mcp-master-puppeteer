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
    resizeForLLM = true,
    maxDimension,
    resizeStrategy = 'cut'
  } = args;
  
  // Default max dimension: 2000 for multiple screenshots, 8000 for single
  const defaultMaxDimension = breakpoints.length > 1 ? 2000 : 8000;
  const maxDim = maxDimension ?? defaultMaxDimension;
  
  const page = await getPage();
  const errorCollector = new ErrorCollector(page);
  const screenshots = [];
  
  try {
    // Start error collection
    await errorCollector.start();
    
    // Execute any actions before screenshot
    if (actions.length > 0) {
      await executePageActions(page, actions);
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
      
      // Calculate actual dimensions for the screenshot
      let actualWidth = fullPage ? dimensions.content.width : Math.min(dimensions.content.width, breakpoint);
      let actualHeight = fullPage ? dimensions.content.height : Math.min(dimensions.content.height, 800);
      
      // Check if we need to resize for LLM
      let viewportForScreenshot = { width: breakpoint, height: 800 };
      let clipOptions: { x: number; y: number; width: number; height: number } | undefined;
      
      // Configure screenshot options
      const screenshotOptions: any = {
        encoding: 'base64',
        fullPage: fullPage && !selector,
        type: format
      };
      
      if (format === 'jpeg') {
        screenshotOptions.quality = quality;
      }
      
      if (resizeForLLM) {
        const maxDimension = Math.max(actualWidth, actualHeight);
        if (maxDimension > maxDim) {
          if (resizeStrategy === 'resize') {
            // Resize strategy: Scale down the viewport to fit within max dimension
            const scaleFactor = maxDim / maxDimension;
            const scaledWidth = Math.round(breakpoint * scaleFactor);
            const scaledHeight = Math.round(800 * scaleFactor);
            
            // Set scaled viewport
            viewportForScreenshot = { width: scaledWidth, height: scaledHeight };
            await page.setViewport(viewportForScreenshot);
            await new Promise(resolve => setTimeout(resolve, 300)); // Wait for resize
            
            // Update actual dimensions
            actualWidth = Math.round(actualWidth * scaleFactor);
            actualHeight = Math.round(actualHeight * scaleFactor);
          } else {
            // Cut strategy: Keep original viewport but crop the image
            if (actualWidth > maxDim || actualHeight > maxDim) {
              const clippedWidth = Math.min(actualWidth, maxDim);
              const clippedHeight = Math.min(actualHeight, maxDim);
              
              clipOptions = {
                x: 0,
                y: 0,
                width: clippedWidth,
                height: clippedHeight
              };
              
              // Update actual dimensions to reflect the cropped size
              actualWidth = clippedWidth;
              actualHeight = clippedHeight;
            }
          }
        }
      }
      
      // Add clip options if using cut strategy
      if (clipOptions && !selector) {
        screenshotOptions.clip = clipOptions;
        screenshotOptions.fullPage = false; // Can't use fullPage with clip
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
      
      // Calculate aspect ratio
      const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
      const aspectGcd = gcd(actualWidth, actualHeight);
      const aspectRatio = `${actualWidth / aspectGcd}:${actualHeight / aspectGcd}`;
      
      screenshots.push({
        viewport: viewportForScreenshot,
        dataUrl: `data:image/${format};base64,${screenshot}`,
        format,
        dimensions: {
          width: actualWidth,
          height: actualHeight,
          aspectRatio
        },
        fullPage
      });
    }
    
    // Stop error collection
    errorCollector.stop();
    
    // Get errors if any
    const errors = errorCollector.getErrors();
    
    // Build minimal result
    const result: ScreenshotPlusResult = {
      screenshots
    };
    
    // Only add errors if there are any
    if (errors.length > 0) {
      result.errors = errors;
    }
    
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

// Removed formatFileSize - not needed with optimized returns