#!/usr/bin/env npx tsx

import { screenshotPlus } from '../src/tools/screenshotPlus.js';
import { closeBrowser } from '../src/utils/browserManager.js';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';

async function testResizeStrategies() {
  try {
    console.log('Testing resize strategies for screenshotPlus...\n');
    
    // Navigate to a test page
    console.log('1. Navigating to example.com...');
    await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'none'
    });
    
    // Test 1: Cut strategy (default)
    console.log('\n2. Testing CUT strategy (default)...');
    const cutResult = await screenshotPlus({
      name: 'test-cut',
      breakpoints: [1280, 1920], // Multiple screenshots trigger 2000px limit
      resizeStrategy: 'cut' // Explicitly set, but this is default
    });
    
    console.log('Cut strategy results:');
    cutResult.screenshots.forEach((s, i) => {
      console.log(`  Screenshot ${i + 1}:`);
      console.log(`    Viewport: ${s.viewport.width}x${s.viewport.height}`);
      console.log(`    Actual dimensions: ${s.dimensions.width}x${s.dimensions.height}`);
      console.log(`    Aspect ratio: ${s.dimensions.aspectRatio}`);
    });
    
    // Test 2: Resize strategy
    console.log('\n3. Testing RESIZE strategy...');
    const resizeResult = await screenshotPlus({
      name: 'test-resize',
      breakpoints: [1280, 1920], // Multiple screenshots trigger 2000px limit
      resizeStrategy: 'resize'
    });
    
    console.log('Resize strategy results:');
    resizeResult.screenshots.forEach((s, i) => {
      console.log(`  Screenshot ${i + 1}:`);
      console.log(`    Viewport: ${s.viewport.width}x${s.viewport.height}`);
      console.log(`    Actual dimensions: ${s.dimensions.width}x${s.dimensions.height}`);
      console.log(`    Aspect ratio: ${s.dimensions.aspectRatio}`);
    });
    
    // Test 3: Single screenshot (should use 8000px limit)
    console.log('\n4. Testing single screenshot (8000px limit)...');
    const singleResult = await screenshotPlus({
      name: 'test-single',
      breakpoints: [1920], // Single screenshot uses 8000px limit
      fullPage: true
    });
    
    console.log('Single screenshot result:');
    console.log(`  Viewport: ${singleResult.screenshots[0].viewport.width}x${singleResult.screenshots[0].viewport.height}`);
    console.log(`  Actual dimensions: ${singleResult.screenshots[0].dimensions.width}x${singleResult.screenshots[0].dimensions.height}`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
  }
}

testResizeStrategies();