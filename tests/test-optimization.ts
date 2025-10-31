#!/usr/bin/env npx tsx

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { screenshotPlus } from '../src/tools/screenshotPlus.js';
import { extractContent } from '../src/tools/extractContent.js';
import { getPageInfo } from '../src/tools/getPageInfo.js';
import { analyzeForms } from '../src/tools/analyzeForms.js';
import { batchInteract } from '../src/tools/batchInteract.js';
import { closeBrowser } from '../src/utils/browserManager.js';

const TEST_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'test-outputs');

interface TestResult {
  toolName: string;
  testCase: string;
  outputSize: number;
  outputSizeKB: number;
  estimatedTokens: number;
  result: Record<string, any>;
  timestamp: string;
}

// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function saveResult(result: TestResult) {
  const filename = `${result.toolName}_${result.testCase}.json`;
  const filepath = join(OUTPUT_DIR, filename);
  await writeFile(filepath, JSON.stringify(result, null, 2));
  console.log(`✓ ${result.toolName} (${result.testCase}): ${result.outputSizeKB.toFixed(2)}KB, ~${result.estimatedTokens} tokens`);
}

async function runTests() {
  console.log('Creating output directory...');
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\nTesting against: ${TEST_URL}\n`);
  console.log('=' .repeat(80));

  // Test 1: navigateAnalyze with different configurations
  console.log('\n📍 Testing navigateAnalyze...');

  // Default (minimal)
  let result: Record<string, any> = await navigateAnalyze({
    url: TEST_URL
  });
  let json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'navigateAnalyze',
    testCase: 'default',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // With metadata
  result = await navigateAnalyze({
    url: TEST_URL,
    includeMetadata: true
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'navigateAnalyze',
    testCase: 'with_metadata',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // With performance
  result = await navigateAnalyze({
    url: TEST_URL,
    includePerformance: true
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'navigateAnalyze',
    testCase: 'with_performance',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // With markdown content
  result = await navigateAnalyze({
    url: TEST_URL,
    contentFormat: 'markdown',
    includeMetadata: true
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'navigateAnalyze',
    testCase: 'with_markdown_content',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // Full featured
  result = await navigateAnalyze({
    url: TEST_URL,
    contentFormat: 'structured-json',
    includeMetadata: true,
    includePerformance: true
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'navigateAnalyze',
    testCase: 'full_featured',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // Test 2: extractContent with different formats
  console.log('\n📄 Testing extractContent...');

  result = await extractContent({
    outputFormat: 'markdown'
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'extractContent',
    testCase: 'markdown',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  result = await extractContent({
    outputFormat: 'plain-text'
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'extractContent',
    testCase: 'plain_text',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  result = await extractContent({
    outputFormat: 'structured-json',
    includeAnalysis: true
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'extractContent',
    testCase: 'structured_json_with_analysis',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // Test 3: getPageInfo with different sections
  console.log('\n📊 Testing getPageInfo...');

  result = await getPageInfo({
    sections: ['metadata']
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'getPageInfo',
    testCase: 'metadata_only',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  result = await getPageInfo({
    sections: ['seo']
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'getPageInfo',
    testCase: 'seo_only',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  result = await getPageInfo({
    sections: ['seo', 'metadata', 'accessibility', 'performance']
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'getPageInfo',
    testCase: 'all_sections',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // Test 4: analyzeForms
  console.log('\n📝 Testing analyzeForms...');

  result = await analyzeForms();
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'analyzeForms',
    testCase: 'default',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  // Test 5: screenshotPlus (without actually including the image data in our analysis)
  console.log('\n📸 Testing screenshotPlus...');

  result = await screenshotPlus({
    name: 'test',
    breakpoints: [1280],
    fullPage: false
  });
  // Remove base64 data for analysis
  const resultWithoutImages = {
    ...result,
    screenshots: result.screenshots.map((s: any) => ({
      ...s,
      dataUrl: `[BASE64 DATA - ${s.dataUrl.length} chars]`
    }))
  };
  json = JSON.stringify(resultWithoutImages, null, 2);
  await saveResult({
    toolName: 'screenshotPlus',
    testCase: 'single_breakpoint',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result: resultWithoutImages,
    timestamp: new Date().toISOString()
  });

  result = await screenshotPlus({
    name: 'test',
    breakpoints: [375, 768, 1280],
    fullPage: true
  });
  const resultWithoutImages2 = {
    ...result,
    screenshots: result.screenshots.map((s: any) => ({
      ...s,
      dataUrl: `[BASE64 DATA - ${s.dataUrl.length} chars]`
    }))
  };
  json = JSON.stringify(resultWithoutImages2, null, 2);
  await saveResult({
    toolName: 'screenshotPlus',
    testCase: 'multiple_breakpoints_fullpage',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result: resultWithoutImages2,
    timestamp: new Date().toISOString()
  });

  // Test 6: batchInteract
  console.log('\n🎯 Testing batchInteract...');

  result = await batchInteract({
    actions: [
      { type: 'scroll', position: { x: 0, y: 100 } },
      { type: 'wait', duration: 100 }
    ]
  });
  json = JSON.stringify(result, null, 2);
  await saveResult({
    toolName: 'batchInteract',
    testCase: 'simple_actions',
    outputSize: json.length,
    outputSizeKB: json.length / 1024,
    estimatedTokens: estimateTokens(json),
    result,
    timestamp: new Date().toISOString()
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ All tests completed! Results saved to:', OUTPUT_DIR);
  console.log('\nNext steps:');
  console.log('1. Review the output files to identify unnecessary data');
  console.log('2. Look for patterns in token usage');
  console.log('3. Optimize based on findings\n');

  await closeBrowser();
}

runTests().catch(console.error);
