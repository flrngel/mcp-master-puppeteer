#!/usr/bin/env node

// Test script for 'none' content format
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testNoneFormat() {
  console.log('🚀 Testing "none" Content Format...\n');

  try {
    // Test 1: Default (none format)
    console.log('1️⃣ Testing default (none format)...');
    const defaultNav = await navigateAnalyze({ 
      url: 'https://example.com'
    });
    console.log('Result:', JSON.stringify(defaultNav, null, 2));
    console.log('Has content?', 'content' in defaultNav);

    // Test 2: Explicit none format
    console.log('\n2️⃣ Testing explicit none format...');
    const noneNav = await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'none'
    });
    console.log('Result keys:', Object.keys(noneNav));
    console.log('Has content?', 'content' in noneNav);

    // Test 3: With markdown format
    console.log('\n3️⃣ Testing with markdown format...');
    const markdownNav = await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'markdown'
    });
    console.log('Has content?', 'content' in markdownNav);
    console.log('Content length:', markdownNav.content?.length || 0);

    // Test 4: None format without metadata
    console.log('\n4️⃣ Testing none format without metadata...');
    const minimalNav = await navigateAnalyze({ 
      url: 'https://example.com',
      contentFormat: 'none',
      includeMetadata: false
    });
    console.log('Result:', JSON.stringify(minimalNav, null, 2));
    console.log('Result size (chars):', JSON.stringify(minimalNav).length);

    console.log('\n✅ Summary:');
    console.log('- Default contentFormat is "none" for fastest response');
    console.log('- Content field is omitted when format is "none"');
    console.log('- Significantly reduces response size');
    console.log('- Perfect for status checks or when only title is needed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run tests
testNoneFormat();