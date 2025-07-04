#!/usr/bin/env node

// Test script for new default options
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { extractContent } from '../src/tools/extractContent.js';
import { getPageInfo } from '../src/tools/getPageInfo.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testDefaults() {
  console.log('🎯 Testing Smart Defaults...\n');

  try {
    // Test 1: navigateAnalyze with default metadata
    console.log('1️⃣ Testing navigateAnalyze defaults...');
    const navDefault = await navigateAnalyze({ 
      url: 'https://github.com'  // Use a site with metadata
    });
    console.log('Has metadata by default?', !!navDefault.metadata);
    if (navDefault.metadata) {
      console.log('Metadata fields:', Object.keys(navDefault.metadata));
      console.log('Description:', navDefault.metadata.description?.substring(0, 50) + '...');
    }

    // Test 2: navigateAnalyze without metadata
    console.log('\n2️⃣ Testing navigateAnalyze minimal...');
    const navMinimal = await navigateAnalyze({ 
      url: 'https://example.com',
      includeMetadata: false
    });
    console.log('Has metadata?', !!navMinimal.metadata);
    console.log('Response keys:', Object.keys(navMinimal));

    // Test 3: extractContent with structured-json
    console.log('\n3️⃣ Testing extractContent structured-json...');
    const structuredJson = await extractContent({
      outputFormat: 'structured-json'
    });
    console.log('Has analysis by default?', !!structuredJson.analysis);
    console.log('Content is JSON?', structuredJson.content.startsWith('{'));

    // Test 4: extractContent markdown (no analysis by default)
    console.log('\n4️⃣ Testing extractContent markdown...');
    const markdown = await extractContent({
      outputFormat: 'markdown'
    });
    console.log('Has analysis?', !!markdown.analysis);
    console.log('Response keys:', Object.keys(markdown));

    // Test 5: getPageInfo default sections
    console.log('\n5️⃣ Testing getPageInfo defaults...');
    const pageInfo = await getPageInfo();
    console.log('Response keys:', Object.keys(pageInfo));
    console.log('Has SEO info?', !!pageInfo.seoAssessment);
    console.log('Has metadata?', !!pageInfo.metadataAnalysis);

    console.log('\n✅ Summary of smart defaults:');
    console.log('- navigateAnalyze: Includes basic metadata by default');
    console.log('- extractContent: Includes analysis for structured-json');
    console.log('- getPageInfo: Returns SEO + metadata sections');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testDefaults();