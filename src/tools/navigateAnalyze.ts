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
    contentFormat = 'markdown',
    includeRawHtml = false
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
    
    // Collect all data in parallel
    const [metadata, performance, rawHtml] = await Promise.all([
      extractPageMetadata(page),
      analyzePagePerformance(page, navigationTimeMs),
      includeRawHtml ? page.content() : Promise.resolve(undefined)
    ]);
    
    // Process content based on format
    let contentData: string;
    let processing: any = { method: 'raw' };
    
    if (contentFormat === 'markdown') {
      const extractedContent = await extractPageContent(page);
      contentData = createContentSummary(extractedContent);
      processing = {
        method: 'turndown',
        options: {
          headingStyle: 'atx',
          codeBlockStyle: 'fenced'
        }
      };
      
      if (rawHtml) {
        processing.stats = {
          originalSizeBytes: new TextEncoder().encode(rawHtml).length,
          processedSizeBytes: new TextEncoder().encode(contentData).length,
          reductionPercent: 0
        };
        processing.stats.reductionPercent = Math.round(
          ((processing.stats.originalSizeBytes - processing.stats.processedSizeBytes) / 
           processing.stats.originalSizeBytes) * 100
        );
      }
    } else if (contentFormat === 'html') {
      contentData = await page.content();
      processing = { method: 'raw' };
    } else {
      // Plain text extraction
      contentData = await page.evaluate(() => document.body.innerText);
      processing = { method: 'custom', options: { format: 'plain-text' } };
    }
    
    // Get final URL after redirects
    const finalUrl = page.url();
    
    // Stop error collection
    errorCollector.stop();
    
    // Build the enhanced result
    const result: NavigateAnalyzeResult = {
      navigationInfo: {
        originalUrl: url,
        finalUrl,
        statusCode: response.status(),
        statusText: response.statusText(),
        redirectChain: redirectChain.length > 0 ? [url, ...redirectChain, finalUrl].filter((v, i, a) => a.indexOf(v) === i) : [],
        navigationTimeMs
      },
      content: {
        format: contentFormat,
        data: contentData,
        processing,
        ...(includeRawHtml && rawHtml ? { rawHtml } : {})
      },
      pageMetadata: {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: metadata.ogTags,
        twitterCard: metadata.twitterTags,
        otherMeta: metadata.otherMeta
      },
      performanceMetrics: {
        loadTimeMs: performance.loadTime,
        timestamp: performance.timestamp,
        resourceCounts: {
          ...performance.resourceCount,
          fonts: 0 // TODO: Count fonts
        }
      },
      pageErrors: errorCollector.getErrors(),
      errorSummary: errorCollector.getSummary()
    };
    
    return result;
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}