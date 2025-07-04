#!/usr/bin/env node

// Test script for screenshot resizing functionality
import { screenshotPlus } from '../src/tools/screenshotPlus.js';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testResize() {
  console.log('📸 Testing Screenshot Resizing for LLM...\n');

  try {
    // Navigate to a page with large content
    console.log('1️⃣ Navigating to test page...');
    await navigateAnalyze({ 
      url: 'https://github.com',
      includeMetadata: false
    });

    // Test 1: Default resizing (should resize if > 8000px)
    console.log('\n2️⃣ Testing default resizing...');
    const defaultResize = await screenshotPlus({
      name: 'test-default',
      breakpoints: [1920], // Large viewport
      fullPage: true
    });
    
    console.log('Screenshot taken with default settings:');
    console.log('- Viewport:', defaultResize.screenshots[0].viewport);
    console.log('- Dimensions:', defaultResize.screenshots[0].dimensions);
    console.log('- Full page:', defaultResize.screenshots[0].fullPage);

    // Test 2: Custom max pixels
    console.log('\n3️⃣ Testing custom max pixels (4000)...');
    const customResize = await screenshotPlus({
      name: 'test-custom',
      breakpoints: [1920],
      fullPage: true,
      resizeForLLM: true,
      maxPixels: 4000
    });
    
    console.log('Screenshot with custom max pixels:');
    console.log('- Viewport:', customResize.screenshots[0].viewport);
    console.log('- Dimensions:', customResize.screenshots[0].dimensions);

    // Test 3: Disable resizing
    console.log('\n4️⃣ Testing with resizing disabled...');
    const noResize = await screenshotPlus({
      name: 'test-no-resize',
      breakpoints: [1920],
      fullPage: true,
      resizeForLLM: false
    });
    
    console.log('Screenshot without resizing:');
    console.log('- Viewport:', noResize.screenshots[0].viewport);
    console.log('- Dimensions:', noResize.screenshots[0].dimensions);

    // Test 4: Multiple breakpoints with resizing
    console.log('\n5️⃣ Testing multiple breakpoints...');
    const multiBreakpoint = await screenshotPlus({
      name: 'test-multi',
      breakpoints: [375, 768, 1280, 1920],
      resizeForLLM: true,
      maxPixels: 6000
    });
    
    console.log('Multiple breakpoints:');
    multiBreakpoint.screenshots.forEach((screenshot, i) => {
      console.log(`  Breakpoint ${i + 1}:`, {
        viewport: screenshot.viewport.width,
        actualWidth: screenshot.dimensions.width,
        aspectRatio: screenshot.dimensions.aspectRatio
      });
    });

    console.log('\n✅ Resizing features:');
    console.log('- Default behavior: Resize if > 8000px');
    console.log('- Maintains aspect ratio during resize');
    console.log('- Can be customized or disabled');
    console.log('- Works with all breakpoints');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testResize();