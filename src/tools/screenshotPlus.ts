import { getPage, executePageActions } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { getPageDimensions, analyzePagePerformance } from '../utils/pageAnalyzer.js';
import { ScreenshotPlusResult, PageAction } from '../types/index.js';

interface ScreenshotPlusArgs {
  name: string;
  breakpoints?: number[];
  selector?: string;
  fullPage?: boolean;
  format?: 'png' | 'jpeg';
  quality?: number;
  actions?: PageAction[];
}

const DEFAULT_BREAKPOINTS = [375, 768, 1280]; // Mobile, Tablet, Desktop

export async function screenshotPlus(args: ScreenshotPlusArgs): Promise<ScreenshotPlusResult> {
  const {
    name,
    breakpoints = DEFAULT_BREAKPOINTS,
    selector,
    fullPage = true,
    format = 'jpeg',
    quality = 80,
    actions = []
  } = args;
  
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
    
    const startTime = Date.now();
    
    // Take screenshots at each breakpoint
    for (const breakpoint of breakpoints) {
      // Set viewport
      await page.setViewport({
        width: breakpoint,
        height: 800 // Default height, will capture full page
      });
      
      // Wait for any viewport-based changes to settle
      await page.waitForTimeout(500);
      
      // Get dimensions
      const dimensions = await getPageDimensions(page);
      
      // Configure screenshot options
      const screenshotOptions: any = {
        encoding: 'base64',
        fullPage: fullPage && !selector,
        type: format
      };
      
      if (format === 'jpeg') {
        screenshotOptions.quality = quality;
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
      
      // Calculate approximate file size (base64 is ~33% larger than binary)
      const fileSize = Math.round((screenshot.length * 3) / 4);
      
      screenshots.push({
        breakpoint,
        image: `data:image/${format};base64,${screenshot}`,
        format,
        dimensions,
        fileSize
      });
    }
    
    const loadTime = Date.now() - startTime;
    const performance = await analyzePagePerformance(page, loadTime);
    
    // Stop error collection
    errorCollector.stop();
    
    return {
      screenshots,
      performance,
      errors: errorCollector.getErrors(),
      errorSummary: errorCollector.getSummary()
    };
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}