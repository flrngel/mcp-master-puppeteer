import { getPage } from '../utils/browserManager.js';
import { extractPageContent, htmlToMarkdown } from '../utils/htmlToMarkdown.js';
import { ExtractContentOptions, ExtractedContentResult } from '../types/enhanced.js';

export async function extractContent(args: ExtractContentOptions = {}): Promise<ExtractedContentResult> {
  const { 
    selector, 
    includeHidden = false,
    outputFormat = 'markdown',
    includeRawHtml = false,
    preserveFormatting = true
  } = args;
  
  const page = await getPage();
  const url = page.url();
  const timestamp = new Date().toISOString();
  
  // Get raw HTML if requested or needed for processing
  let rawHtml: string | undefined;
  if (includeRawHtml || outputFormat === 'html') {
    if (selector) {
      rawHtml = await page.$eval(selector, el => el.outerHTML);
    } else {
      rawHtml = await page.content();
    }
  }
  
  // Extract structured content
  const extractedContent = await extractPageContent(page);
  
  // Calculate text statistics
  let totalWordCount = 0;
  let totalCharacterCount = 0;
  const paragraphsWithStats = extractedContent.paragraphs.map((text, index) => {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = text.length;
    totalWordCount += wordCount;
    totalCharacterCount += characterCount;
    return {
      text,
      wordCount,
      characterCount,
      position: index
    };
  });
  
  // Calculate reading time (average 200 words per minute)
  const estimatedReadingTimeSeconds = Math.ceil((totalWordCount / 200) * 60);
  
  // Process links
  const hyperlinks = extractedContent.links.map(link => ({
    displayText: link.text,
    targetUrl: link.href,
    isExternal: !link.href.startsWith(new URL(url).origin),
    isValid: link.href.startsWith('http') || link.href.startsWith('https'),
    surroundingContext: link.context
  }));
  
  // Process images
  const images = extractedContent.images.map(img => ({
    sourceUrl: img.src,
    alternativeText: img.alt,
    title: img.title,
    isDecorative: !img.alt || img.alt.trim() === '',
    dimensions: undefined // TODO: Get actual dimensions if needed
  }));
  
  // Process tables
  const tables = extractedContent.tables.map(table => ({
    format: 'markdown' as const,
    data: table.markdown,
    dimensions: {
      rows: table.markdown.split('\n').length - 2, // Minus header and separator
      columns: table.markdown.split('\n')[0]?.split('|').length - 2 || 0
    },
    hasHeaders: true,
    caption: table.summary
  }));
  
  // Create formatted content based on output format
  let formattedData: string;
  let processing: any;
  
  if (outputFormat === 'markdown') {
    formattedData = `# ${extractedContent.title}\n\n`;
    
    // Add headings
    if (extractedContent.headings.length > 0) {
      extractedContent.headings.forEach(h => {
        formattedData += `${'#'.repeat(h.level)} ${h.text}\n\n`;
      });
    }
    
    // Add paragraphs
    paragraphsWithStats.forEach(p => {
      formattedData += `${p.text}\n\n`;
    });
    
    processing = {
      method: 'turndown',
      options: {
        preserveFormatting,
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
      }
    };
  } else if (outputFormat === 'plain-text') {
    formattedData = extractedContent.title + '\n\n';
    formattedData += paragraphsWithStats.map(p => p.text).join('\n\n');
    processing = {
      method: 'custom',
      options: { format: 'plain-text' }
    };
  } else if (outputFormat === 'html' && rawHtml) {
    formattedData = rawHtml;
    processing = { method: 'raw' };
  } else {
    // Structured JSON format
    formattedData = JSON.stringify({
      title: extractedContent.title,
      headings: extractedContent.headings,
      paragraphs: paragraphsWithStats,
      links: hyperlinks,
      images: images,
      tables: tables
    }, null, 2);
    processing = {
      method: 'custom',
      options: { format: 'structured-json' }
    };
  }
  
  const result: ExtractedContentResult = {
    extractionMetadata: {
      sourceFormat: 'html',
      extractedAt: timestamp,
      selector,
      includeHidden,
      documentUrl: url
    },
    structuredContent: {
      documentTitle: extractedContent.title,
      headingHierarchy: extractedContent.headings.map(h => ({
        level: h.level as 1 | 2 | 3 | 4 | 5 | 6,
        text: h.text,
        id: undefined,
        slug: h.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      })),
      textContent: {
        paragraphs: paragraphsWithStats,
        totalWordCount,
        totalCharacterCount,
        estimatedReadingTimeSeconds
      },
      hyperlinks,
      media: {
        images,
        videos: [], // TODO: Extract videos
        audioFiles: [] // TODO: Extract audio
      },
      tables,
      lists: {
        ordered: [], // TODO: Extract ordered lists
        unordered: [] // TODO: Extract unordered lists
      }
    },
    formattedContent: {
      format: outputFormat,
      data: formattedData,
      processing
    },
    ...(includeRawHtml && rawHtml ? { rawHtml } : {})
  };
  
  return result;
}