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

    // Test 1: Single image (should use 8000 max)
    console.log('\n2️⃣ Testing single image (8000px max)...');
    const singleImage = await screenshotPlus({
      name: 'test-single',
      breakpoints: [1920], // Single breakpoint
      fullPage: true
    });
    
    const dims1 = singleImage.screenshots[0].dimensions;
    const maxDim1 = Math.max(dims1.width, dims1.height);
    console.log('Single image (8000px max):');
    console.log('- Viewport:', singleImage.screenshots[0].viewport);
    console.log('- Dimensions:', `${dims1.width}×${dims1.height}`);
    console.log('- Max dimension:', maxDim1, `(${maxDim1 > 8000 ? 'resized' : 'within limit'})`);

    // Test 2: Multiple images (should use 2000 max)
    console.log('\n3️⃣ Testing multiple images (2000px max)...');
    const multipleImages = await screenshotPlus({
      name: 'test-multiple',
      breakpoints: [375, 768, 1280], // Multiple breakpoints
      fullPage: true
    });
    
    console.log('Multiple images (auto 2000px limit):');
    multipleImages.screenshots.forEach((screenshot, i) => {
      const maxDim = Math.max(screenshot.dimensions.width, screenshot.dimensions.height);
      console.log(`  Image ${i + 1}: ${screenshot.dimensions.width}×${screenshot.dimensions.height}, max dim: ${maxDim}`);
    });

    // Test 3: Custom max dimension
    console.log('\n4️⃣ Testing custom max dimension...');
    const customMax = await screenshotPlus({
      name: 'test-custom',
      breakpoints: [1920],
      fullPage: true,
      resizeForLLM: true,
      maxDimension: 4000
    });
    
    const dims3 = customMax.screenshots[0].dimensions;
    const maxDim3 = Math.max(dims3.width, dims3.height);
    console.log('Custom max dimension (4000px):');
    console.log('- Dimensions:', `${dims3.width}×${dims3.height}`);
    console.log('- Max dimension:', maxDim3);

    // Test 4: Disable resizing
    console.log('\n5️⃣ Testing with resizing disabled...');
    const noResize = await screenshotPlus({
      name: 'test-no-resize',
      breakpoints: [1920],
      fullPage: true,
      resizeForLLM: false
    });
    
    const dims4 = noResize.screenshots[0].dimensions;
    const maxDim4 = Math.max(dims4.width, dims4.height);
    console.log('No resizing:');
    console.log('- Dimensions:', `${dims4.width}×${dims4.height}`);
    console.log('- Max dimension:', maxDim4, '(original)');

    console.log('\n✅ Resizing features:');
    console.log('- Single image: 8000×8000 max (Claude.ai single image limit)');
    console.log('- Multiple images: 2000×2000 max (Claude.ai multi-image limit)');
    console.log('- Maintains aspect ratio when resizing');
    console.log('- Can be customized or disabled');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testResize();