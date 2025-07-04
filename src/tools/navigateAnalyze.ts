import { getPage } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { extractPageMetadata, analyzePagePerformance } from '../utils/pageAnalyzer.js';
import { extractPageContent, createContentSummary, htmlToMarkdown } from '../utils/htmlToMarkdown.js';
import { NavigateAnalyzeOptions, NavigateAnalyzeResult } from '../types/enhanced.js';

export async function navigateAnalyze(args: NavigateAnalyzeOptions): Promise<NavigateAnalyzeResult> {
  const { 
    url, 
    waitUntil = 'networkidle0', 
    timeout = 30000,
    contentFormat = 'none',  // Default to none for minimal response
    includeMetadata = true,  // Default to true for basic metadata
    includePerformance = false
  } = args;
  
  const page = await getPage();
  const errorCollector = new ErrorCollector(page);
  const redirectChain: string[] = [];
  
  try {
    // Start error collection
    await errorCollector.start();
    
    // Track redirects
    page.on('response', response => {
      if (response.status() >= 300 && response.status() < 400) {
        const location = response.headers()['location'];
        if (location) {
          redirectChain.push(location);
        }
      }
    });
    
    // Navigate with timing
    const startTime = Date.now();
    const response = await page.goto(url, {
      waitUntil: waitUntil as any,
      timeout
    });
    
    if (!response) {
      throw new Error('Navigation failed - no response received');
    }
    
    const navigationTimeMs = Date.now() - startTime;
    
    // Get page title (always needed)
    const pageTitle = await page.title();
    
    // Process content based on format
    let contentData: string | undefined;
    
    if (contentFormat !== 'none') {
      if (contentFormat === 'markdown') {
        const extractedContent = await extractPageContent(page);
        contentData = createContentSummary(extractedContent);
      } else if (contentFormat === 'html') {
        contentData = await page.content();
      } else if (contentFormat === 'plain-text') {
        contentData = await page.evaluate(() => document.body.innerText);
      } else {
        // structured-json format
        const extracted = await extractPageContent(page);
        contentData = JSON.stringify({
          title: pageTitle,
          headings: extracted.headings,
          paragraphs: extracted.paragraphs,
          links: extracted.links
        }, null, 2);
      }
    }
    
    // Get final URL after redirects
    const finalUrl = page.url();
    
    // Stop error collection
    errorCollector.stop();
    
    // Collect errors if any
    const errors = errorCollector.getErrors();
    
    // Build the optimized result - minimal by default
    const result: NavigateAnalyzeResult = {
      url: finalUrl,
      statusCode: response.status(),
      title: pageTitle,
      contentFormat,
    };
    
    // Only add content if format is not 'none'
    if (contentData !== undefined) {
      result.content = contentData;
    }
    
    // Only add errors if there are any
    if (errors.length > 0) {
      result.errors = errors;
    }
    
    // Add basic metadata by default
    if (includeMetadata) {
      const metadata = await extractPageMetadata(page);
      // Only include the most useful metadata
      const basicMetadata: any = {};
      
      if (metadata.description) {
        basicMetadata.description = metadata.description;
      }
      
      // Only include essential OG tags
      if (metadata.ogTags['og:image']) {
        basicMetadata.ogImage = metadata.ogTags['og:image'];
      }
      
      if (redirectChain.length > 0) {
        basicMetadata.redirectChain = redirectChain;
      }
      
      // Only add metadata if we have any
      if (Object.keys(basicMetadata).length > 0) {
        result.metadata = basicMetadata;
      }
    }
    
    // Only add performance if requested
    if (includePerformance) {
      const performance = await analyzePagePerformance(page, navigationTimeMs);
      result.performance = {
        loadTimeMs: performance.loadTime,
        resourceCounts: {
          total: performance.resourceCount.total,
          images: performance.resourceCount.images,
          scripts: performance.resourceCount.scripts,
          stylesheets: performance.resourceCount.stylesheets
        }
      };
    }
    
    return result;
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}