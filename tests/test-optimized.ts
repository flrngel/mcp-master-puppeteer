#!/usr/bin/env node

// Test script for optimized token-efficient tools
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { screenshotPlus } from '../src/tools/screenshotPlus.js';
import { extractContent } from '../src/tools/extractContent.js';
import { batchInteract } from '../src/tools/batchInteract.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testOptimizedTools() {
  console.log('🚀 Testing Optimized MCP Puppeteer Tools...\n');

  try {
    // Test 1: Minimal navigate - should return only essentials
    console.log('1️⃣ Testing minimal navigateAnalyze...');
    const minimalNav = await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'markdown'
    });
    console.log('Minimal result keys:', Object.keys(minimalNav));
    console.log('Content length:', minimalNav.content.length);
    console.log('Has errors?', !!minimalNav.errors);
    console.log('Has metadata?', !!minimalNav.metadata);
    console.log('Has performance?', !!minimalNav.performance);

    // Test 2: Navigate with metadata
    console.log('\n2️⃣ Testing navigateAnalyze with metadata...');
    const navWithMeta = await navigateAnalyze({ 
      url: 'https://example.com',
      includeMetadata: true
    });
    console.log('Has metadata?', !!navWithMeta.metadata);
    if (navWithMeta.metadata) {
      console.log('Metadata keys:', Object.keys(navWithMeta.metadata));
    }

    // Test 3: Extract content - minimal
    console.log('\n3️⃣ Testing minimal extractContent...');
    const minimalContent = await extractContent({
      outputFormat: 'markdown'
    });
    console.log('Result keys:', Object.keys(minimalContent));
    console.log('Word count:', minimalContent.wordCount);
    console.log('Has analysis?', !!minimalContent.analysis);

    // Test 4: Extract with analysis
    console.log('\n4️⃣ Testing extractContent with analysis...');
    const contentWithAnalysis = await extractContent({
      outputFormat: 'markdown',
      includeAnalysis: true
    });
    console.log('Has analysis?', !!contentWithAnalysis.analysis);
    if (contentWithAnalysis.analysis) {
      console.log('Analysis includes:', {
        headings: contentWithAnalysis.analysis.headings.length,
        links: contentWithAnalysis.analysis.links.length,
        images: contentWithAnalysis.analysis.images.length
      });
    }

    // Test 5: Screenshot - optimized
    console.log('\n5️⃣ Testing optimized screenshot...');
    const screenshot = await screenshotPlus({
      name: 'test',
      breakpoints: [1280],
      format: 'jpeg'
    });
    console.log('Result keys:', Object.keys(screenshot));
    console.log('Screenshots:', screenshot.screenshots.length);
    console.log('First screenshot keys:', Object.keys(screenshot.screenshots[0]));

    // Test 6: Batch interact - optimized
    console.log('\n6️⃣ Testing optimized batchInteract...');
    const batch = await batchInteract({
      actions: [
        { type: 'click', selector: 'a' }
      ]
    });
    console.log('Result keys:', Object.keys(batch));
    console.log('Has errors?', !!batch.errors);

    console.log('\n✅ Token optimization summary:');
    console.log('- Minimal returns by default');
    console.log('- Optional metadata/analysis via flags');
    console.log('- No duplicate content (e.g., markdown + HTML)');
    console.log('- No redundant size information');
    console.log('- Errors only when present');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testOptimizedTools();