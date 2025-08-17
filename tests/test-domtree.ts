#!/usr/bin/env npx tsx

/**
 * Test script for DOM tree integration
 * Usage: npx tsx tests/test-domtree.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { extractContent } from '../src/tools/extractContent.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testDomTreeIntegration() {
  console.log('🧪 Testing DOM tree integration...\n');

  try {
    // Test 1: Navigate to a page with DOM tree enabled
    console.log('Test 1: Navigate with DOM tree (no highlights)');
    const result1 = await navigateAnalyze({
      url: 'https://example.com',
      includeDomTree: true,
      domTreeOptions: {
        showHighlightElements: false,
        viewportExpansion: 0
      }
    });

    console.log('✅ Navigation successful');
    console.log(`  URL: ${result1.url}`);
    console.log(`  Title: ${result1.title}`);
    
    if (result1.domTree) {
      console.log(`  Interactive elements count: ${result1.domTree.count}`);
      
      if (result1.domTree.elements.length > 0) {
        console.log('\n  First 5 interactive elements:');
        result1.domTree.elements.slice(0, 5).forEach((elem: any) => {
          console.log(`    [${elem.index}] <${elem.tag}>`);
          if (elem.text) {
            console.log(`      Text: "${elem.text.substring(0, 50)}..."`);
          }
          if (elem.href) {
            console.log(`      Href: ${elem.href}`);
          }
        });
      }
    } else {
      console.log('  ⚠️ No DOM tree data returned');
    }

    console.log('\n---\n');

    // Test 2: Navigate with visual highlights
    console.log('Test 2: Navigate with visual highlights enabled');
    const result2 = await navigateAnalyze({
      url: 'https://www.google.com',
      includeDomTree: true,
      domTreeOptions: {
        showHighlightElements: true,
        viewportExpansion: 100
      }
    });

    console.log('✅ Navigation successful');
    console.log(`  URL: ${result2.url}`);
    console.log(`  Title: ${result2.title}`);
    
    if (result2.domTree) {
      console.log(`  Interactive elements count: ${result2.domTree.count}`);
      console.log('  Highlights should be visible on the page');
    }

    console.log('\n---\n');

    // Test 3: Extract content with DOM tree
    console.log('Test 3: Extract content with DOM tree');
    const result3 = await extractContent({
      outputFormat: 'markdown',
      includeDomTree: true,
      includeAnalysis: true,
      domTreeOptions: {
        showHighlightElements: false,
        viewportExpansion: -1 // Get all elements regardless of viewport
      }
    });

    console.log('✅ Content extraction successful');
    console.log(`  Word count: ${result3.wordCount}`);
    console.log(`  Format: ${result3.contentFormat}`);
    
    if (result3.domTree) {
      console.log(`  Interactive elements count: ${result3.domTree.count}`);
    }

    if (result3.analysis) {
      console.log(`  Headings: ${result3.analysis.headings.length}`);
      console.log(`  Links: ${result3.analysis.links.length}`);
      console.log(`  Images: ${result3.analysis.images.length}`);
    }

    console.log('\n---\n');

    // Test 4: Navigate to a complex page
    console.log('Test 4: Navigate to complex page (GitHub)');
    const result4 = await navigateAnalyze({
      url: 'https://github.com',
      includeDomTree: true,
      domTreeOptions: {
        showHighlightElements: false,
        viewportExpansion: 0
      }
    });

    console.log('✅ Navigation successful');
    console.log(`  URL: ${result4.url}`);
    console.log(`  Title: ${result4.title}`);
    
    if (result4.domTree) {
      console.log(`  Interactive elements count: ${result4.domTree.count}`);
      
      // Group interactive elements by tag name
      const tagCounts: Record<string, number> = {};
      result4.domTree.elements.forEach((elem: any) => {
        tagCounts[elem.tag] = (tagCounts[elem.tag] || 0) + 1;
      });
      
      console.log('\n  Interactive elements by tag:');
      Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tag, count]) => {
          console.log(`    ${tag}: ${count}`);
        });
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run the tests
testDomTreeIntegration();