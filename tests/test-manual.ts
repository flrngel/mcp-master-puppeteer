#!/usr/bin/env node

// Manual test script to verify the tools work correctly
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { screenshotPlus } from '../src/tools/screenshotPlus.js';
import { extractContent } from '../src/tools/extractContent.js';
import { getPageInfo } from '../src/tools/getPageInfo.js';
import { analyzeForms } from '../src/tools/analyzeForms.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testTools() {
  console.log('🧪 Testing MCP Puppeteer Tools...\n');

  try {
    // Test 1: Navigate and analyze
    console.log('1️⃣ Testing navigateAnalyze...');
    const navResult = await navigateAnalyze({ 
      url: 'https://example.com' 
    });
    console.log('✅ Navigate result:', {
      statusCode: navResult.statusCode,
      title: navResult.metadata.title,
      errorCount: navResult.errorSummary.totalErrors
    });

    // Test 2: Get page info
    console.log('\n2️⃣ Testing getPageInfo...');
    const pageInfo = await getPageInfo();
    console.log('✅ Page info:', {
      title: pageInfo.title,
      hasDescription: pageInfo.seo.hasDescription,
      dimensions: pageInfo.dimensions.content
    });

    // Test 3: Extract content
    console.log('\n3️⃣ Testing extractContent...');
    const content = await extractContent({});
    console.log('✅ Extracted content:', {
      headings: content.headings.length,
      paragraphs: content.paragraphs.length,
      links: content.links.length
    });

    // Test 4: Screenshot
    console.log('\n4️⃣ Testing screenshotPlus...');
    const screenshotResult = await screenshotPlus({
      name: 'test',
      breakpoints: [1280],
      format: 'jpeg'
    });
    console.log('✅ Screenshot result:', {
      count: screenshotResult.screenshots.length,
      dimensions: screenshotResult.screenshots[0].dimensions,
      fileSize: `${Math.round(screenshotResult.screenshots[0].fileSize / 1024)}KB`
    });

    // Test 5: Analyze forms (navigate to a page with forms first)
    console.log('\n5️⃣ Testing analyzeForms...');
    await navigateAnalyze({ url: 'https://github.com/login' });
    const formsResult = await analyzeForms();
    console.log('✅ Forms analysis:', {
      formCount: formsResult.formCount,
      totalInputs: formsResult.summary.totalInputs,
      purposes: formsResult.summary.formPurposes
    });

    console.log('\n✨ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testTools();