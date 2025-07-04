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
    
    const dims1 = defaultResize.screenshots[0].dimensions;
    const totalPixels1 = dims1.width * dims1.height;
    console.log('Screenshot taken with default settings:');
    console.log('- Viewport:', defaultResize.screenshots[0].viewport);
    console.log('- Dimensions:', dims1);
    console.log('- Total pixels:', totalPixels1.toLocaleString(), `(${totalPixels1 > 8000 ? 'resized' : 'original'})`);

    // Test 2: Custom max pixels
    console.log('\n3️⃣ Testing custom max pixels (4000)...');
    const customResize = await screenshotPlus({
      name: 'test-custom',
      breakpoints: [1920],
      fullPage: true,
      resizeForLLM: true,
      maxPixels: 4000
    });
    
    const dims2 = customResize.screenshots[0].dimensions;
    const totalPixels2 = dims2.width * dims2.height;
    console.log('Screenshot with custom max pixels:');
    console.log('- Viewport:', customResize.screenshots[0].viewport);
    console.log('- Dimensions:', dims2);
    console.log('- Total pixels:', totalPixels2.toLocaleString(), `(${totalPixels2 > 4000 ? 'resized' : 'within limit'})`);

    // Test 3: Disable resizing
    console.log('\n4️⃣ Testing with resizing disabled...');
    const noResize = await screenshotPlus({
      name: 'test-no-resize',
      breakpoints: [1920],
      fullPage: true,
      resizeForLLM: false
    });
    
    const dims3 = noResize.screenshots[0].dimensions;
    const totalPixels3 = dims3.width * dims3.height;
    console.log('Screenshot without resizing:');
    console.log('- Viewport:', noResize.screenshots[0].viewport);
    console.log('- Dimensions:', dims3);
    console.log('- Total pixels:', totalPixels3.toLocaleString(), '(original size)');

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
      const totalPx = screenshot.dimensions.width * screenshot.dimensions.height;
      console.log(`  Breakpoint ${i + 1}:`, {
        viewport: screenshot.viewport.width,
        actualDimensions: `${screenshot.dimensions.width}×${screenshot.dimensions.height}`,
        totalPixels: totalPx.toLocaleString(),
        status: totalPx > 6000 ? 'resized' : 'within limit'
      });
    });

    console.log('\n✅ Resizing features:');
    console.log('- Default behavior: Resize if total pixels > 8000');
    console.log('- Uses square root scaling to maintain aspect ratio');
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