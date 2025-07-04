import { getPage } from '../utils/browserManager.js';
import { extractPageContent } from '../utils/htmlToMarkdown.js';
import { ExtractedContent } from '../types/index.js';

interface ExtractContentArgs {
  selector?: string; // Optional: extract from specific element
  includeHidden?: boolean; // Include hidden elements
}

export async function extractContent(args: ExtractContentArgs = {}): Promise<ExtractedContent> {
  const { selector, includeHidden = false } = args;
  const page = await getPage();
  
  if (selector) {
    // Extract from specific element
    return await page.evaluate((sel, hidden) => {
      const element = document.querySelector(sel);
      if (!element) {
        throw new Error(`Element not found: ${sel}`);
      }
      
      // Temporarily inject the element as the body for extraction
      const originalBody = document.body.innerHTML;
      document.body.innerHTML = element.outerHTML;
      
      const content = extractContentFromDocument(hidden);
      
      // Restore original body
      document.body.innerHTML = originalBody;
      
      return content;
    }, selector, includeHidden);
  } else {
    // Extract from entire page
    return await page.evaluate((hidden) => {
      return extractContentFromDocument(hidden);
    }, includeHidden);
  }
}

// Helper function to be injected into the page
function extractContentFromDocument(includeHidden: boolean): ExtractedContent {
  const content: ExtractedContent = {
    title: document.title || 'Untitled',
    headings: [],
    paragraphs: [],
    links: [],
    images: [],
    tables: []
  };
  
  // Helper to check if element is visible
  const isVisible = (elem: Element): boolean => {
    if (includeHidden) return true;
    const style = window.getComputedStyle(elem);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  };
  
  // Extract headings
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    if (isVisible(heading)) {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent?.trim();
      if (text) {
        content.headings.push({ level, text });
      }
    }
  });
  
  // Extract paragraphs
  const paragraphs = document.querySelectorAll('p');
  paragraphs.forEach(p => {
    if (isVisible(p)) {
      const text = p.textContent?.trim();
      if (text && text.length > 10) { // Skip very short paragraphs
        content.paragraphs.push(text);
      }
    }
  });
  
  // Extract links with context
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    if (isVisible(link)) {
      const a = link as HTMLAnchorElement;
      const text = a.textContent?.trim() || '';
      const href = a.href;
      
      // Get surrounding context
      let context = '';
      const parent = a.parentElement;
      if (parent) {
        const parentText = parent.textContent || '';
        const linkIndex = parentText.indexOf(text);
        const contextStart = Math.max(0, linkIndex - 50);
        const contextEnd = Math.min(parentText.length, linkIndex + text.length + 50);
        context = parentText.substring(contextStart, contextEnd).trim();
        if (contextStart > 0) context = '...' + context;
        if (contextEnd < parentText.length) context = context + '...';
      }
      
      content.links.push({ text, href, context });
    }
  });
  
  // Extract images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (isVisible(img)) {
      const image = img as HTMLImageElement;
      content.images.push({
        src: image.src,
        alt: image.alt || undefined,
        title: image.title || undefined
      });
    }
  });
  
  // Extract and convert tables
  const tables = document.querySelectorAll('table');
  tables.forEach(table => {
    if (isVisible(table)) {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return;
      
      let markdown = '';
      let headerCount = 0;
      
      // Process header row
      const firstRow = rows[0];
      const headers = Array.from(firstRow.querySelectorAll('th, td'));
      if (headers.length > 0) {
        headerCount = headers.length;
        markdown += '| ' + headers.map(h => (h.textContent?.trim() || '').replace(/\|/g, '\\|')).join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
      }
      
      // Process data rows
      for (let i = 1; i < rows.length; i++) {
        const cells = Array.from(rows[i].querySelectorAll('td'));
        if (cells.length > 0) {
          // Pad or trim cells to match header count
          const cellTexts = cells.map(c => (c.textContent?.trim() || '').replace(/\|/g, '\\|'));
          while (cellTexts.length < headerCount) cellTexts.push('');
          if (cellTexts.length > headerCount) cellTexts.length = headerCount;
          
          markdown += '| ' + cellTexts.join(' | ') + ' |\n';
        }
      }
      
      content.tables.push({
        markdown: markdown.trim(),
        summary: `Table with ${headerCount} columns and ${rows.length} rows`
      });
    }
  });
  
  return content;
}