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
      console.log(`  Total elements: ${result1.domTree.totalElements}`);
      console.log(`  Interactive elements: ${result1.domTree.totalInteractive}`);
      
      if (result1.domTree.interactiveElements.length > 0) {
        console.log('\n  First 5 interactive elements:');
        result1.domTree.interactiveElements.slice(0, 5).forEach(elem => {
          console.log(`    [${elem.highlightIndex}] <${elem.tagName}> ${elem.xpath}`);
          if (elem.text) {
            console.log(`      Text: "${elem.text.substring(0, 50)}..."`);
          }
          if (elem.attributes.href) {
            console.log(`      Href: ${elem.attributes.href}`);
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
      console.log(`  Total elements: ${result2.domTree.totalElements}`);
      console.log(`  Interactive elements: ${result2.domTree.totalInteractive}`);
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
      console.log(`  Total elements: ${result3.domTree.totalElements}`);
      console.log(`  Interactive elements: ${result3.domTree.totalInteractive}`);
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
      console.log(`  Total elements: ${result4.domTree.totalElements}`);
      console.log(`  Interactive elements: ${result4.domTree.totalInteractive}`);
      
      // Group interactive elements by tag name
      const tagCounts: Record<string, number> = {};
      result4.domTree.interactiveElements.forEach(elem => {
        tagCounts[elem.tagName] = (tagCounts[elem.tagName] || 0) + 1;
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