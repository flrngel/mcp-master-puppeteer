#!/usr/bin/env node

import { getPage } from '../src/utils/browserManager.js';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testViewport() {
  console.log('🧪 Testing viewport configuration...\n');

  try {
    // Test 1: Check initial viewport when getting a page
    console.log('1️⃣ Testing initial viewport on page creation...');
    const page = await getPage();
    const initialViewport = page.viewport();
    console.log('✅ Initial viewport:', initialViewport);
    
    if (initialViewport?.width !== 1920 || initialViewport?.height !== 1080) {
      console.error('❌ Viewport not set correctly on page creation');
    } else {
      console.log('✅ Viewport correctly set to 1920x1080 on page creation');
    }

    // Test 2: Navigate and check viewport is maintained
    console.log('\n2️⃣ Testing viewport after navigation...');
    await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'none'
    });
    
    const viewportAfterNav = page.viewport();
    console.log('✅ Viewport after navigation:', viewportAfterNav);
    
    if (viewportAfterNav?.width !== 1920 || viewportAfterNav?.height !== 1080) {
      console.error('❌ Viewport not maintained after navigation');
    } else {
      console.log('✅ Viewport correctly maintained at 1920x1080 after navigation');
    }

    console.log('\n✨ Viewport test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

testViewport();