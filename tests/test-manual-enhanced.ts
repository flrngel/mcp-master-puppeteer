#!/usr/bin/env node

// Manual test script to verify the enhanced tools work correctly
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { screenshotPlus } from '../src/tools/screenshotPlus.js';
import { extractContent } from '../src/tools/extractContent.js';
import { getPageInfo } from '../src/tools/getPageInfo.js';
import { analyzeForms } from '../src/tools/analyzeForms.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testEnhancedTools() {
  console.log('🧪 Testing Enhanced MCP Puppeteer Tools...\n');

  try {
    // Test 1: Navigate and analyze with format options
    console.log('1️⃣ Testing navigateAnalyze with enhanced return fields...');
    const navResult = await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'markdown',
      includeRawHtml: false
    });
    console.log('✅ Navigate result:', {
      navigationInfo: {
        statusCode: navResult.navigationInfo.statusCode,
        redirectChain: navResult.navigationInfo.redirectChain.length
      },
      content: {
        format: navResult.content.format,
        dataLength: navResult.content.data.length,
        hasProcessingInfo: !!navResult.content.processing
      },
      pageMetadata: {
        title: navResult.pageMetadata.title,
        hasOpenGraph: Object.keys(navResult.pageMetadata.openGraph).length > 0
      },
      errorCount: navResult.errorSummary.totalErrors
    });

    // Test 2: Get comprehensive page info
    console.log('\n2️⃣ Testing getPageInfo with detailed metadata...');
    const pageInfo = await getPageInfo();
    console.log('✅ Page info:', {
      pageIdentification: {
        title: pageInfo.pageIdentification.title,
        language: pageInfo.pageIdentification.language,
        charset: pageInfo.pageIdentification.charset
      },
      seoAssessment: {
        titleOptimal: pageInfo.seoAssessment.titleAnalysis.isOptimal,
        hasDescription: pageInfo.seoAssessment.descriptionAnalysis.exists,
        hasCanonical: pageInfo.seoAssessment.canonicalStatus.hasCanonical
      },
      accessibilityScore: {
        altTextCoverage: pageInfo.accessibilityMetrics.imageAccessibility.altTextCoveragePercent + '%',
        hasLandmarks: pageInfo.accessibilityMetrics.landmarks.hasMain
      }
    });

    // Test 3: Extract content with format options
    console.log('\n3️⃣ Testing extractContent with format options...');
    const markdownContent = await extractContent({
      outputFormat: 'markdown',
      includeRawHtml: false
    });
    console.log('✅ Markdown extraction:', {
      format: markdownContent.formattedContent?.format,
      wordCount: markdownContent.structuredContent.textContent.totalWordCount,
      readingTime: `${markdownContent.structuredContent.textContent.estimatedReadingTimeSeconds}s`,
      headings: markdownContent.structuredContent.headingHierarchy.length,
      links: markdownContent.structuredContent.hyperlinks.length
    });

    // Test JSON format
    const jsonContent = await extractContent({
      outputFormat: 'structured-json'
    });
    console.log('✅ JSON extraction format:', jsonContent.formattedContent?.format);

    // Test 4: Enhanced screenshot with metadata
    console.log('\n4️⃣ Testing screenshotPlus with enhanced metadata...');
    const screenshotResult = await screenshotPlus({
      name: 'test',
      breakpoints: [1280],
      format: 'jpeg',
      optimizeForSize: true,
      includeMetadata: true
    });
    console.log('✅ Screenshot result:', {
      totalScreenshots: screenshotResult.screenshotResults.length,
      firstScreenshot: {
        viewport: screenshotResult.screenshotResults[0].viewportConfiguration,
        dimensions: screenshotResult.screenshotResults[0].imageDimensions,
        fileSize: screenshotResult.screenshotResults[0].imageMetrics.fileSizeFormatted,
        aspectRatio: screenshotResult.screenshotResults[0].imageDimensions.aspectRatio,
        optimized: screenshotResult.screenshotResults[0].imageMetrics.isOptimized
      },
      captureMetadata: {
        totalTime: `${screenshotResult.captureMetadata.totalCaptureTimeMs}ms`,
        hasActionsLog: screenshotResult.captureMetadata.actionsPerformed.length > 0,
        browserInfo: !!screenshotResult.captureMetadata.browserInfo
      }
    });

    // Test 5: Navigate to form page for testing
    console.log('\n5️⃣ Navigating to GitHub login for form analysis...');
    await navigateAnalyze({ 
      url: 'https://github.com/login',
      contentFormat: 'html'
    });
    
    const formsResult = await analyzeForms();
    console.log('✅ Forms analysis:', {
      formCount: formsResult.formCount,
      totalInputs: formsResult.summary.totalInputs,
      purposes: formsResult.summary.formPurposes
    });

    console.log('\n✨ All enhanced tests completed successfully!');
    console.log('📊 Key improvements demonstrated:');
    console.log('   - Clear format indicators (markdown/html/json)');
    console.log('   - Processing metadata and statistics');
    console.log('   - Descriptive nested field names');
    console.log('   - Rich metadata for all operations');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testEnhancedTools();