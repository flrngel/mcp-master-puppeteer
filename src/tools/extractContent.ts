import { getPage } from '../utils/browserManager.js';
import { extractPageContent, htmlToMarkdown } from '../utils/htmlToMarkdown.js';
import { ExtractContentOptions, ExtractedContentResult } from '../types/enhanced.js';

export async function extractContent(args: ExtractContentOptions = {}): Promise<ExtractedContentResult> {
  const { 
    selector, 
    includeHidden = false,
    outputFormat = 'markdown',
    includeAnalysis = args.includeAnalysis !== undefined 
      ? args.includeAnalysis 
      : outputFormat === 'structured-json' // Auto-include for structured-json
  } = args;
  
  const page = await getPage();
  
  // Extract content based on selector
  let content: string;
  let wordCount = 0;
  
  if (outputFormat === 'html') {
    // Get raw HTML
    if (selector) {
      content = await page.$eval(selector, el => el.outerHTML);
    } else {
      content = await page.content();
    }
    // Rough word count for HTML
    const textContent = await page.evaluate((sel: string | undefined) => {
      const el = sel ? document.querySelector(sel) : document.body;
      return el ? (el as HTMLElement).innerText : '';
    }, selector);
    wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length;
  } else {
    // Extract structured content for other formats
    const extractedContent = await extractPageContent(page);
    wordCount = extractedContent.paragraphs.join(' ').split(/\s+/).filter((word: string) => word.length > 0).length;
    
    if (outputFormat === 'markdown') {
      // Convert to markdown
      content = `# ${extractedContent.title}\n\n`;
      if (extractedContent.headings.length > 0) {
        extractedContent.headings.forEach(h => {
          content += `${'#'.repeat(h.level)} ${h.text}\n\n`;
        });
      }
      extractedContent.paragraphs.forEach(p => {
        content += `${p}\n\n`;
      });
    } else if (outputFormat === 'plain-text') {
      // Plain text
      content = extractedContent.title + '\n\n';
      content += extractedContent.paragraphs.join('\n\n');
    } else {
      // structured-json
      content = JSON.stringify({
        title: extractedContent.title,
        headings: extractedContent.headings,
        paragraphs: extractedContent.paragraphs,
        wordCount
      }, null, 2);
    }
  }
  
  // Build minimal result
  const result: ExtractedContentResult = {
    content,
    contentFormat: outputFormat,
    wordCount
  };
  
  // Add analysis if requested or if using structured-json format
  if (includeAnalysis) {
    // Re-extract if we haven't already for non-HTML formats
    const extractedContent = outputFormat === 'html' 
      ? await extractPageContent(page)
      : await extractPageContent(page); // Already extracted above
    const url = page.url();
    
    result.analysis = {
      headings: extractedContent.headings.map(h => ({
        level: h.level as 1 | 2 | 3 | 4 | 5 | 6,
        text: h.text
      })),
      links: extractedContent.links.map(link => ({
        text: link.text,
        url: link.href,
        external: !link.href.startsWith(new URL(url).origin)
      })),
      images: extractedContent.images.map(img => ({
        src: img.src,
        alt: img.alt || undefined
      })),
      tables: extractedContent.tables.length,
      lists: {
        ordered: 0, // TODO: Count if needed
        unordered: 0 // TODO: Count if needed
      }
    };
  }
  
  return result;
}