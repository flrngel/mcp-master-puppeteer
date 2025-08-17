#!/usr/bin/env npx tsx

/**
 * Simple test for DOM tree being default
 * Usage: npx tsx tests/test-simple.ts
 */

import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testSimple() {
  console.log('Testing DOM tree as default...\n');

  try {
    // Test without explicitly setting includeDomTree (should be true by default)
    console.log('Navigating without specifying includeDomTree...');
    const result = await navigateAnalyze({
      url: 'https://www.example.com'
    });

    console.log('✅ Navigation successful');
    console.log(`  URL: ${result.url}`);
    console.log(`  Title: ${result.title}`);
    
    if (result.domTree) {
      console.log('✅ DOM tree included by default!');
      console.log(`  Interactive elements: ${result.domTree.count}`);
      
      if (result.domTree.elements.length > 0) {
        console.log('\n  Sample elements:');
        result.domTree.elements.slice(0, 3).forEach(elem => {
          let output = `    [${elem.index}] <${elem.tag}>`;
          if (elem.text) output += ` "${elem.text}"`;
          if (elem.href) output += ` -> ${elem.href}`;
          console.log(output);
        });
      }
    } else {
      console.log('❌ DOM tree NOT included by default');
    }

    // Test with explicitly disabling DOM tree
    console.log('\n\nTesting with includeDomTree: false...');
    const result2 = await navigateAnalyze({
      url: 'https://www.example.com',
      includeDomTree: false
    });

    if (result2.domTree) {
      console.log('❌ DOM tree included when it should be disabled');
    } else {
      console.log('✅ DOM tree correctly excluded when disabled');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

testSimple();