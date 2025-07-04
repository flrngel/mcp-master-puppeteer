import { getPage } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { extractPageMetadata, analyzePagePerformance } from '../utils/pageAnalyzer.js';
import { extractPageContent, createContentSummary } from '../utils/htmlToMarkdown.js';
import { NavigateAnalyzeResult } from '../types/index.js';

export async function navigateAnalyze(args: { url: string; waitUntil?: string; timeout?: number }): Promise<NavigateAnalyzeResult> {
  const { url, waitUntil = 'networkidle0', timeout = 30000 } = args;
  
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
    
    const loadTime = Date.now() - startTime;
    
    // Collect all data
    const [metadata, content, performance] = await Promise.all([
      extractPageMetadata(page),
      extractPageContent(page),
      analyzePagePerformance(page, loadTime)
    ]);
    
    // Create content summary
    const contentPreview = createContentSummary(content);
    
    // Get final URL after redirects
    const finalUrl = page.url();
    
    // Stop error collection
    errorCollector.stop();
    
    return {
      url,
      finalUrl,
      statusCode: response.status(),
      statusText: response.statusText(),
      redirectChain: redirectChain.length > 0 ? [url, ...redirectChain, finalUrl] : [],
      metadata,
      contentPreview,
      performance,
      errors: errorCollector.getErrors(),
      errorSummary: errorCollector.getSummary()
    };
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}