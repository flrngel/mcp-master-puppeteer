import TurndownService from 'turndown';
import { ExtractedContent } from '../types/index.js';

// Configure Turndown for clean markdown output
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined'
});

// Custom rules for better formatting
turndownService.addRule('removeScriptsAndStyles', {
  filter: ['script', 'style', 'noscript'],
  replacement: () => ''
});

turndownService.addRule('simplifyImages', {
  filter: 'img',
  replacement: (_content, node) => {
    const img = node as HTMLImageElement;
    const alt = img.getAttribute('alt') || 'Image';
    const src = img.getAttribute('src') || '';
    return `![${alt}](${src})`;
  }
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

export async function extractPageContent(page: any): Promise<ExtractedContent> {
  return await page.evaluate(() => {
    const content: ExtractedContent = {
      title: document.title || 'Untitled',
      headings: [],
      paragraphs: [],
      links: [],
      images: [],
      tables: []
    };

    // Extract headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.substring(1));
      content.headings.push({
        level,
        text: heading.textContent?.trim() || ''
      });
    });

    // Extract paragraphs
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      const text = p.textContent?.trim();
      if (text) {
        content.paragraphs.push(text);
      }
    });

    // Extract links with context
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const a = link as HTMLAnchorElement;
      const parent = a.parentElement;
      const context = parent?.textContent?.substring(0, 100) || '';
      
      content.links.push({
        text: a.textContent?.trim() || '',
        href: a.href,
        context: context.trim()
      });
    });

    // Extract images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const image = img as HTMLImageElement;
      content.images.push({
        src: image.src,
        alt: image.alt,
        title: image.title
      });
    });

    // Extract tables and convert to markdown
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return;

      let markdown = '';
      const headers = Array.from(rows[0].querySelectorAll('th, td'));
      
      if (headers.length > 0) {
        // Header row
        markdown += '| ' + headers.map(h => h.textContent?.trim() || '').join(' | ') + ' |\n';
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        
        // Data rows
        for (let i = 1; i < rows.length; i++) {
          const cells = Array.from(rows[i].querySelectorAll('td'));
          markdown += '| ' + cells.map(c => c.textContent?.trim() || '').join(' | ') + ' |\n';
        }
        
        content.tables.push({
          markdown,
          summary: `Table with ${headers.length} columns and ${rows.length} rows`
        });
      }
    });

    return content;
  });
}

export function createContentSummary(content: ExtractedContent): string {
  let summary = `# ${content.title}\n\n`;
  
  if (content.headings.length > 0) {
    summary += '## Page Structure\n\n';
    content.headings.forEach(h => {
      const indent = '  '.repeat(h.level - 1);
      summary += `${indent}- ${h.text}\n`;
    });
    summary += '\n';
  }
  
  if (content.paragraphs.length > 0) {
    summary += '## Content Preview\n\n';
    // Include first 3 paragraphs
    content.paragraphs.slice(0, 3).forEach(p => {
      summary += `${p}\n\n`;
    });
    if (content.paragraphs.length > 3) {
      summary += `_...and ${content.paragraphs.length - 3} more paragraphs_\n\n`;
    }
  }
  
  if (content.links.length > 0) {
    summary += `## Links (${content.links.length} total)\n\n`;
    content.links.slice(0, 10).forEach(link => {
      summary += `- [${link.text || link.href}](${link.href})\n`;
    });
    if (content.links.length > 10) {
      summary += `- _...and ${content.links.length - 10} more links_\n`;
    }
    summary += '\n';
  }
  
  if (content.images.length > 0) {
    summary += `## Images (${content.images.length} total)\n\n`;
    content.images.slice(0, 5).forEach(img => {
      summary += `- ${img.alt || 'No alt text'} (${img.src})\n`;
    });
    if (content.images.length > 5) {
      summary += `- _...and ${content.images.length - 5} more images_\n`;
    }
  }
  
  return summary;
}