import { Page } from 'puppeteer';
import { PageMetadata, PageDimensions, PagePerformance, FormInfo } from '../types/index.js';

export async function extractPageMetadata(page: Page): Promise<PageMetadata> {
  return await page.evaluate(() => {
    const metadata: PageMetadata = {
      title: document.title || '',
      ogTags: {},
      twitterTags: {},
      otherMeta: {}
    };

    // Get all meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property') || '';
      const content = tag.getAttribute('content') || '';

      if (!name || !content) return;

      if (name === 'description') {
        metadata.description = content;
      } else if (name === 'keywords') {
        metadata.keywords = content;
      } else if (name.startsWith('og:')) {
        metadata.ogTags[name] = content;
      } else if (name.startsWith('twitter:')) {
        metadata.twitterTags[name] = content;
      } else {
        metadata.otherMeta[name] = content;
      }
    });

    return metadata;
  });
}

export async function getPageDimensions(page: Page): Promise<PageDimensions> {
  const viewport = page.viewport() || { width: 800, height: 600 };
  
  const contentSize = await page.evaluate(() => {
    return {
      width: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
        document.documentElement.offsetWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth
      ),
      height: Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight
      )
    };
  });

  return {
    viewport: { width: viewport.width, height: viewport.height },
    content: contentSize
  };
}

export async function analyzePagePerformance(page: Page, loadTime: number): Promise<PagePerformance> {
  const resourceCount = await page.evaluate(() => {
    const images = document.querySelectorAll('img').length;
    const scripts = document.querySelectorAll('script').length;
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length;
    
    return {
      images,
      scripts,
      stylesheets,
      total: images + scripts + stylesheets
    };
  });

  return {
    loadTime,
    timestamp: new Date().toISOString(),
    resourceCount
  };
}

export async function analyzeForms(page: Page): Promise<FormInfo[]> {
  return await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const formInfos: FormInfo[] = [];

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select, textarea, button[type="submit"]');
      const inputInfos = Array.from(inputs).map(input => {
        const elem = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const info: any = {
          type: elem.type || elem.tagName.toLowerCase(),
          name: elem.name,
          id: elem.id,
          value: elem.value,
          placeholder: (elem as HTMLInputElement).placeholder,
          required: elem.required,
          disabled: elem.disabled,
          validation: {}
        };

        // Add validation attributes
        if (elem instanceof HTMLInputElement) {
          if (elem.minLength > -1) info.validation.minLength = elem.minLength;
          if (elem.maxLength > -1) info.validation.maxLength = elem.maxLength;
          if (elem.min) info.validation.min = elem.min;
          if (elem.max) info.validation.max = elem.max;
          if (elem.pattern) info.validation.pattern = elem.pattern;
        }

        // Get select options
        if (elem instanceof HTMLSelectElement) {
          info.options = Array.from(elem.options).map(opt => ({
            value: opt.value,
            text: opt.text
          }));
        }

        return info;
      });

      formInfos.push({
        id: form.id,
        name: form.name,
        action: form.action,
        method: form.method,
        inputs: inputInfos
      });
    });

    return formInfos;
  });
}

export async function getPageStructure(page: Page): Promise<string> {
  // Simplified version to avoid transpilation issues
  return await page.evaluate(() => {
    const lines: string[] = [];
    
    if (document.body) {
      lines.push('body');
      
      // Find main structural elements
      const main = document.querySelector('main');
      if (main) lines.push('  main');
      
      const header = document.querySelector('header');
      if (header) lines.push('  header');
      
      const nav = document.querySelector('nav');
      if (nav) lines.push('  nav');
      
      const footer = document.querySelector('footer');
      if (footer) lines.push('  footer');
      
      // Count forms
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        lines.push(`  ${forms.length} form(s)`);
      }
      
      // Count sections
      const sections = document.querySelectorAll('section');
      if (sections.length > 0) {
        lines.push(`  ${sections.length} section(s)`);
      }
    }
    
    return lines.join('\n');
  });
}