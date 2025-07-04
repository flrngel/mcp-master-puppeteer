import { getPage } from '../utils/browserManager.js';
import { extractPageMetadata, getPageDimensions, getPageStructure, analyzePagePerformance } from '../utils/pageAnalyzer.js';
import { GetPageInfoOptions, GetPageInfoResult } from '../types/enhanced.js';

export async function getPageInfo(args: GetPageInfoOptions = {}): Promise<GetPageInfoResult> {
  const { sections = ['seo'] } = args;
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
    // Document structure
    const hasProperDoctype = document.doctype !== null;
    const hasLangAttribute = document.documentElement.hasAttribute('lang');
    const declaredLanguage = document.documentElement.getAttribute('lang') || undefined;
    const hasTitle = document.title.length > 0;
    
    // Landmarks
    const landmarks = {
      hasMain: !!document.querySelector('main'),
      hasNav: !!document.querySelector('nav'),
      hasHeader: !!document.querySelector('header'),
      hasFooter: !!document.querySelector('footer'),
      hasAside: !!document.querySelector('aside'),
      landmarkRoles: [] as string[],
      skipLinks: false
    };
    
    // Check for ARIA landmarks
    const ariaRoles = ['banner', 'navigation', 'main', 'complementary', 'contentinfo'];
    ariaRoles.forEach(role => {
      if (document.querySelector(`[role="${role}"]`)) {
        landmarks.landmarkRoles.push(role);
      }
    });
    
    // Check for skip links
    const firstLink = document.querySelector('a[href^="#"]');
    if (firstLink && firstLink.textContent?.toLowerCase().includes('skip')) {
      landmarks.skipLinks = true;
    }
    
    // Heading analysis
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const headingLevels = headings.map(h => parseInt(h.tagName.substring(1)));
    const uniqueLevels = [...new Set(headingLevels)].sort();
    const missingLevels = [];
    for (let i = 1; i < Math.max(...uniqueLevels); i++) {
      if (!uniqueLevels.includes(i)) {
        missingLevels.push(i);
      }
    }
    
    // Image accessibility
    const images = document.querySelectorAll('img');
    let imagesWithAlt = 0;
    let imagesWithEmptyAlt = 0;
    let decorativeImages = 0;
    
    images.forEach(img => {
      if (img.hasAttribute('alt')) {
        imagesWithAlt++;
        if (img.getAttribute('alt') === '') {
          imagesWithEmptyAlt++;
          decorativeImages++;
        }
      }
      if (img.getAttribute('role') === 'presentation' || img.getAttribute('aria-hidden') === 'true') {
        decorativeImages++;
      }
    });
    
    const missingAltImages = images.length - imagesWithAlt;
    const altTextCoveragePercent = images.length > 0 ? Math.round((imagesWithAlt / images.length) * 100) : 100;
    
    // Form accessibility
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input, select, textarea');
    let inputsWithoutLabels = 0;
    let formsWithLabels = 0;
    
    inputs.forEach(input => {
      const id = input.id;
      const hasLabel = !!(id && document.querySelector(`label[for="${id}"]`)) ||
                      !!input.closest('label') ||
                      input.hasAttribute('aria-label') ||
                      input.hasAttribute('aria-labelledby');
      if (!hasLabel) {
        inputsWithoutLabels++;
      }
    });
    
    forms.forEach(form => {
      const formInputs = form.querySelectorAll('input, select, textarea');
      let hasAllLabels = true;
      formInputs.forEach(input => {
        const id = input.id;
        const hasLabel = !!(id && document.querySelector(`label[for="${id}"]`)) ||
                        !!input.closest('label') ||
                        input.hasAttribute('aria-label');
        if (!hasLabel) hasAllLabels = false;
      });
      if (hasAllLabels && formInputs.length > 0) formsWithLabels++;
    });
    
    const ariaUsage = document.querySelector('[aria-label], [aria-labelledby], [aria-describedby], [role]') !== null;
    
    return {
      documentStructure: {
        hasProperDoctype,
        hasLangAttribute,
        declaredLanguage,
        hasTitle
      },
      landmarks,
      headingAnalysis: {
        properHierarchy: missingLevels.length === 0 && headingLevels.length > 0,
        headingLevels: uniqueLevels,
        missingLevels
      },
      imageAccessibility: {
        totalImages: images.length,
        imagesWithAlt,
        imagesWithEmptyAlt,
        decorativeImages,
        altTextCoveragePercent,
        missingAltImages
      },
      formAccessibility: {
        totalForms: forms.length,
        formsWithLabels,
        inputsWithoutLabels,
        ariaUsage
      }
    };
  });
  
  // Get SEO info
  const seo = await page.evaluate(() => {
    const title = document.title;
    const metaDescription = document.querySelector('meta[name="description"]');
    const description = metaDescription?.getAttribute('content') || '';
    
    // Title analysis
    const titleAnalysis = {
      exists: !!title,
      content: title,
      lengthCharacters: title.length,
      isOptimal: title.length >= 30 && title.length <= 60,
      issues: [] as string[]
    };
    
    if (!title) titleAnalysis.issues.push('Missing title tag');
    else if (title.length < 30) titleAnalysis.issues.push('Title too short (< 30 chars)');
    else if (title.length > 60) titleAnalysis.issues.push('Title too long (> 60 chars)');
    
    // Description analysis
    const descriptionAnalysis = {
      exists: !!description,
      content: description,
      lengthCharacters: description.length,
      isOptimal: description.length >= 120 && description.length <= 160,
      issues: [] as string[]
    };
    
    if (!description) descriptionAnalysis.issues.push('Missing meta description');
    else if (description.length < 120) descriptionAnalysis.issues.push('Description too short (< 120 chars)');
    else if (description.length > 160) descriptionAnalysis.issues.push('Description too long (> 160 chars)');
    
    // Heading structure
    const h1Elements = document.querySelectorAll('h1');
    const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingStructure = {
      hasH1: h1Elements.length > 0,
      h1Count: h1Elements.length,
      h1Content: Array.from(h1Elements).map(h => h.textContent?.trim() || ''),
      totalHeadings: allHeadings.length,
      isHierarchical: true, // TODO: Check proper hierarchy
      issues: [] as string[]
    };
    
    if (h1Elements.length === 0) headingStructure.issues.push('Missing H1 tag');
    else if (h1Elements.length > 1) headingStructure.issues.push('Multiple H1 tags found');
    
    // Canonical
    const canonical = document.querySelector('link[rel="canonical"]');
    const canonicalHref = canonical?.getAttribute('href');
    const canonicalStatus = {
      hasCanonical: !!canonical,
      canonicalUrl: canonicalHref || undefined,
      isSelfReferencing: canonicalHref === window.location.href,
      issues: [] as string[]
    };
    
    if (!canonical) canonicalStatus.issues.push('Missing canonical tag');
    
    // Crawlability
    const robotsMeta = document.querySelector('meta[name="robots"]');
    const robotsContent = robotsMeta?.getAttribute('content') || '';
    const crawlability = {
      isIndexable: !robotsContent.includes('noindex'),
      robotsDirectives: robotsContent.split(',').map(d => d.trim()).filter(d => d),
      sitemapReference: undefined as string | undefined
    };
    
    // Check for sitemap in robots meta
    const sitemapLink = document.querySelector('link[rel="sitemap"]');
    if (sitemapLink) {
      crawlability.sitemapReference = sitemapLink.getAttribute('href') || undefined;
    }
    
    return {
      titleAnalysis,
      descriptionAnalysis,
      headingStructure,
      canonicalStatus,
      crawlability
    };
  });
  
  // Get performance indicators
  const performanceIndicators = await page.evaluate(() => {
    // Resource counts
    const images = document.querySelectorAll('img').length;
    const scripts = document.querySelectorAll('script').length;
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length;
    const fonts = document.querySelectorAll('link[rel="preload"][as="font"], link[rel="prefetch"][as="font"]').length;
    
    // Critical metrics
    const hasViewportMeta = !!document.querySelector('meta[name="viewport"]');
    const hasFaviconDefined = !!document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    const usesHTTPS = window.location.protocol === 'https:';
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    return {
      resourceCounts: {
        totalRequests: images + scripts + stylesheets + fonts,
        images,
        scripts,
        stylesheets,
        fonts,
        other: 0
      },
      criticalMetrics: {
        hasViewportMeta,
        hasFaviconDefined,
        usesHTTPS,
        hasServiceWorker
      }
    };
  });
  
  // Build the result
  const result: GetPageInfoResult = {
    pageIdentification: {
      currentUrl: url,
      canonicalUrl: seo.canonicalStatus.canonicalUrl || undefined,
      title,
      language: accessibility.documentStructure.declaredLanguage,
      charset: await page.evaluate(() => document.characterSet),
      lastModified: await page.evaluate(() => document.lastModified)
    },
    metadataAnalysis: {
      metaTags: {
        basic: {
          description: metadata.description,
          keywords: metadata.keywords,
          author: metadata.otherMeta.author,
          robots: metadata.otherMeta.robots,
          viewport: metadata.otherMeta.viewport
        },
        openGraph: metadata.ogTags,
        twitterCard: metadata.twitterTags,
        dublin: {}, // TODO: Extract Dublin Core meta tags
        other: metadata.otherMeta
      },
      structuredData: {
        hasJsonLd: await page.evaluate(() => !!document.querySelector('script[type="application/ld+json"]')),
        hasMicrodata: await page.evaluate(() => !!document.querySelector('[itemscope]')),
        hasRDFa: await page.evaluate(() => !!document.querySelector('[typeof]')),
        schemas: [] // TODO: Extract schema types
      }
    },
    seoAssessment: seo,
    accessibilityMetrics: accessibility,
    performanceIndicators: {
      pageWeight: {
        htmlSizeBytes: await page.evaluate(() => document.documentElement.outerHTML.length),
        totalResourcesBytes: undefined, // TODO: Calculate total resources size
        imageOptimization: 'needs-improvement' // TODO: Assess image optimization
      },
      ...performanceIndicators
    },
    pageStructureOutline: structure
  };
  
  return result;
}