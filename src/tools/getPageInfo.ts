import { getPage } from '../utils/browserManager.js';
import { extractPageMetadata, getPageDimensions, getPageStructure } from '../utils/pageAnalyzer.js';
import { PageMetadata, PageDimensions } from '../types/index.js';

interface PageInfo {
  url: string;
  title: string;
  metadata: PageMetadata;
  dimensions: PageDimensions;
  structure: string;
  accessibility: {
    hasLangAttribute: boolean;
    headingStructure: string[];
    landmarkRoles: string[];
    altTextCoverage: { total: number; withAlt: number; percentage: number };
  };
  seo: {
    hasTitle: boolean;
    titleLength: number;
    hasDescription: boolean;
    descriptionLength: number;
    hasOgTags: boolean;
    hasStructuredData: boolean;
  };
}

export async function getPageInfo(): Promise<PageInfo> {
  const page = await getPage();
  const url = page.url();
  
  // Get basic info
  const [title, metadata, dimensions, structure] = await Promise.all([
    page.title(),
    extractPageMetadata(page),
    getPageDimensions(page),
    getPageStructure(page)
  ]);
  
  // Get accessibility info
  const accessibility = await page.evaluate(() => {
    // Check lang attribute
    const hasLangAttribute = document.documentElement.hasAttribute('lang');
    
    // Get heading structure
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingStructure = headings.map(h => {
      const level = h.tagName.toLowerCase();
      const text = h.textContent?.trim() || '';
      return `${level}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
    });
    
    // Get landmark roles
    const landmarks = Array.from(document.querySelectorAll('[role]'));
    const landmarkRoles = [...new Set(landmarks.map(l => l.getAttribute('role') || ''))]
      .filter(role => ['banner', 'navigation', 'main', 'complementary', 'contentinfo'].includes(role));
    
    // Check alt text coverage
    const images = document.querySelectorAll('img');
    const withAlt = Array.from(images).filter(img => img.hasAttribute('alt') && img.getAttribute('alt')?.trim()).length;
    const altTextCoverage = {
      total: images.length,
      withAlt,
      percentage: images.length > 0 ? Math.round((withAlt / images.length) * 100) : 100
    };
    
    return {
      hasLangAttribute,
      headingStructure,
      landmarkRoles,
      altTextCoverage
    };
  });
  
  // Get SEO info
  const seo = await page.evaluate(() => {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const description = metaDescription?.getAttribute('content') || '';
    
    // Check for OG tags
    const ogTags = document.querySelectorAll('meta[property^="og:"]');
    
    // Check for structured data
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    
    return {
      hasTitle: !!title,
      titleLength: title.length,
      hasDescription: !!description,
      descriptionLength: description.length,
      hasOgTags: ogTags.length > 0,
      hasStructuredData: structuredData.length > 0
    };
  });
  
  return {
    url,
    title,
    metadata,
    dimensions,
    structure,
    accessibility,
    seo
  };
}