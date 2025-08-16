#!/usr/bin/env npx tsx

/**
 * Test compact DOM tree output
 * Usage: npx tsx tests/test-compact.ts
 */

import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testCompactOutput() {
  console.log('Testing compact DOM tree output...\n');

  try {
    // Test 1: Simple page
    console.log('Test 1: Simple page (example.com)');
    const result1 = await navigateAnalyze({
      url: 'https://example.com'
    });

    console.log('Result:');
    console.log(JSON.stringify(result1.domTree, null, 2));
    console.log('\n---\n');

    // Test 2: Complex page with forms
    console.log('Test 2: GitHub login page');
    const result2 = await navigateAnalyze({
      url: 'https://github.com/login'
    });

    console.log('Interactive elements found:', result2.domTree?.count);
    if (result2.domTree && result2.domTree.elements.length > 0) {
      console.log('\nFirst 10 elements:');
      result2.domTree.elements.slice(0, 10).forEach(elem => {
        let output = `[${elem.index}] <${elem.tag}>`;
        if (elem.text) output += ` "${elem.text}"`;
        if (elem.href) output += ` href="${elem.href}"`;
        if (elem.type) output += ` type="${elem.type}"`;
        if (elem.name) output += ` name="${elem.name}"`;
        if (elem.placeholder) output += ` placeholder="${elem.placeholder}"`;
        console.log(output);
      });
    }
    console.log('\n---\n');

    // Test 3: Google search page
    console.log('Test 3: Google search page');
    const result3 = await navigateAnalyze({
      url: 'https://www.google.com'
    });

    console.log('Interactive elements found:', result3.domTree?.count);
    if (result3.domTree && result3.domTree.elements.length > 0) {
      // Group by tag type
      const byTag: Record<string, number> = {};
      result3.domTree.elements.forEach(elem => {
        byTag[elem.tag] = (byTag[elem.tag] || 0) + 1;
      });
      
      console.log('\nElements by tag:');
      Object.entries(byTag)
        .sort((a, b) => b[1] - a[1])
        .forEach(([tag, count]) => {
          console.log(`  ${tag}: ${count}`);
        });
      
      console.log('\nSample elements:');
      result3.domTree.elements.slice(0, 5).forEach(elem => {
        let output = `[${elem.index}] <${elem.tag}>`;
        if (elem.text) output += ` "${elem.text}"`;
        console.log(output);
      });
    }

    console.log('\n✅ Compact format test completed!');
    console.log('\nKey improvements:');
    console.log('- Removed xpath (not needed for actions)');
    console.log('- Removed full attributes object');
    console.log('- Shortened field names (index, tag, etc.)');
    console.log('- Text truncated to 50 chars');
    console.log('- Only essential attributes included');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

testCompactOutput();