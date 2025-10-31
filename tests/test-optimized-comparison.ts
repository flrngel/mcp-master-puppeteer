#!/usr/bin/env npx tsx

import { writeFile } from 'fs/promises';
import { join } from 'path';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { getPageInfo } from '../src/tools/getPageInfo.js';
import { closeBrowser } from '../src/utils/browserManager.js';

const TEST_URL = 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'test-outputs');

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

interface Comparison {
  test: string;
  before: { size: number; tokens: number };
  after: { size: number; tokens: number };
  reduction: { sizeKB: number; sizePercent: number; tokens: number; tokensPercent: number };
}

async function runComparison() {
  console.log('🔬 Testing Optimization Impact\n');
  console.log('=' .repeat(80));

  const comparisons: Comparison[] = [];

  // Test 1: navigateAnalyze - Default (minimal)
  console.log('\n📍 Test 1: navigateAnalyze (default)');

  // Before (this is what the old default would have been - with domTree and all errors)
  const beforeResult1 = await navigateAnalyze({
    url: TEST_URL,
    includeDomTree: true,
    includeAllErrors: true
  });
  let beforeJson = JSON.stringify(beforeResult1, null, 2);
  const beforeSize1 = beforeJson.length;
  const beforeTokens1 = estimateTokens(beforeJson);

  // After (new optimized default)
  const afterResult1 = await navigateAnalyze({
    url: TEST_URL
  });
  let afterJson = JSON.stringify(afterResult1, null, 2);
  const afterSize1 = afterJson.length;
  const afterTokens1 = estimateTokens(afterJson);

  const reduction1 = {
    sizeKB: (beforeSize1 - afterSize1) / 1024,
    sizePercent: ((beforeSize1 - afterSize1) / beforeSize1) * 100,
    tokens: beforeTokens1 - afterTokens1,
    tokensPercent: ((beforeTokens1 - afterTokens1) / beforeTokens1) * 100
  };

  comparisons.push({
    test: 'navigateAnalyze (default)',
    before: { size: beforeSize1, tokens: beforeTokens1 },
    after: { size: afterSize1, tokens: afterTokens1 },
    reduction: reduction1
  });

  console.log(`  Before: ${(beforeSize1/1024).toFixed(2)}KB (~${beforeTokens1} tokens)`);
  console.log(`  After:  ${(afterSize1/1024).toFixed(2)}KB (~${afterTokens1} tokens)`);
  console.log(`  ✅ Saved: ${reduction1.sizeKB.toFixed(2)}KB (${reduction1.sizePercent.toFixed(1)}%) / ${reduction1.tokens} tokens (${reduction1.tokensPercent.toFixed(1)}%)`);

  // Save comparison samples
  await writeFile(
    join(OUTPUT_DIR, 'comparison_navigate_before.json'),
    beforeJson
  );
  await writeFile(
    join(OUTPUT_DIR, 'comparison_navigate_after.json'),
    afterJson
  );

  // Test 2: getPageInfo - metadata only
  console.log('\n📊 Test 2: getPageInfo (metadata only)');

  // Before (returns everything)
  const beforeResult2 = await getPageInfo({
    sections: ['seo', 'metadata', 'accessibility', 'performance']
  });
  beforeJson = JSON.stringify(beforeResult2, null, 2);
  const beforeSize2 = beforeJson.length;
  const beforeTokens2 = estimateTokens(beforeJson);

  // After (respects sections parameter)
  const afterResult2 = await getPageInfo({
    sections: ['metadata']
  });
  afterJson = JSON.stringify(afterResult2, null, 2);
  const afterSize2 = afterJson.length;
  const afterTokens2 = estimateTokens(afterJson);

  const reduction2 = {
    sizeKB: (beforeSize2 - afterSize2) / 1024,
    sizePercent: ((beforeSize2 - afterSize2) / beforeSize2) * 100,
    tokens: beforeTokens2 - afterTokens2,
    tokensPercent: ((beforeTokens2 - afterTokens2) / beforeTokens2) * 100
  };

  comparisons.push({
    test: 'getPageInfo (metadata only)',
    before: { size: beforeSize2, tokens: beforeTokens2 },
    after: { size: afterSize2, tokens: afterTokens2 },
    reduction: reduction2
  });

  console.log(`  Before: ${(beforeSize2/1024).toFixed(2)}KB (~${beforeTokens2} tokens)`);
  console.log(`  After:  ${(afterSize2/1024).toFixed(2)}KB (~${afterTokens2} tokens)`);
  console.log(`  ✅ Saved: ${reduction2.sizeKB.toFixed(2)}KB (${reduction2.sizePercent.toFixed(1)}%) / ${reduction2.tokens} tokens (${reduction2.tokensPercent.toFixed(1)}%)`);

  await writeFile(
    join(OUTPUT_DIR, 'comparison_pageinfo_before.json'),
    beforeJson
  );
  await writeFile(
    join(OUTPUT_DIR, 'comparison_pageinfo_after.json'),
    afterJson
  );

  // Test 3: getPageInfo - SEO only
  console.log('\n📊 Test 3: getPageInfo (seo only)');

  // Before (returns everything)
  const beforeResult3 = await getPageInfo({
    sections: ['seo', 'metadata', 'accessibility', 'performance']
  });
  beforeJson = JSON.stringify(beforeResult3, null, 2);
  const beforeSize3 = beforeJson.length;
  const beforeTokens3 = estimateTokens(beforeJson);

  // After (respects sections parameter)
  const afterResult3 = await getPageInfo({
    sections: ['seo']
  });
  afterJson = JSON.stringify(afterResult3, null, 2);
  const afterSize3 = afterJson.length;
  const afterTokens3 = estimateTokens(afterJson);

  const reduction3 = {
    sizeKB: (beforeSize3 - afterSize3) / 1024,
    sizePercent: ((beforeSize3 - afterSize3) / beforeSize3) * 100,
    tokens: beforeTokens3 - afterTokens3,
    tokensPercent: ((beforeTokens3 - afterTokens3) / beforeTokens3) * 100
  };

  comparisons.push({
    test: 'getPageInfo (seo only)',
    before: { size: beforeSize3, tokens: beforeTokens3 },
    after: { size: afterSize3, tokens: afterTokens3 },
    reduction: reduction3
  });

  console.log(`  Before: ${(beforeSize3/1024).toFixed(2)}KB (~${beforeTokens3} tokens)`);
  console.log(`  After:  ${(afterSize3/1024).toFixed(2)}KB (~${afterTokens3} tokens)`);
  console.log(`  ✅ Saved: ${reduction3.sizeKB.toFixed(2)}KB (${reduction3.sizePercent.toFixed(1)}%) / ${reduction3.tokens} tokens (${reduction3.tokensPercent.toFixed(1)}%)`);

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 OPTIMIZATION SUMMARY\n');

  const totalBeforeSize = comparisons.reduce((sum, c) => sum + c.before.size, 0);
  const totalAfterSize = comparisons.reduce((sum, c) => sum + c.after.size, 0);
  const totalBeforeTokens = comparisons.reduce((sum, c) => sum + c.before.tokens, 0);
  const totalAfterTokens = comparisons.reduce((sum, c) => sum + c.after.tokens, 0);

  console.log('Total across all tests:');
  console.log(`  Before: ${(totalBeforeSize/1024).toFixed(2)}KB, ~${totalBeforeTokens} tokens`);
  console.log(`  After:  ${(totalAfterSize/1024).toFixed(2)}KB, ~${totalAfterTokens} tokens`);
  console.log(`  Saved:  ${((totalBeforeSize - totalAfterSize)/1024).toFixed(2)}KB (${(((totalBeforeSize - totalAfterSize) / totalBeforeSize) * 100).toFixed(1)}%)`);
  console.log(`          ${totalBeforeTokens - totalAfterTokens} tokens (${(((totalBeforeTokens - totalAfterTokens) / totalBeforeTokens) * 100).toFixed(1)}%)`);

  console.log('\nPer-test breakdown:');
  comparisons.forEach(c => {
    console.log(`\n  ${c.test}:`);
    console.log(`    Reduction: ${c.reduction.sizeKB.toFixed(2)}KB (${c.reduction.sizePercent.toFixed(1)}%) / ${c.reduction.tokens} tokens (${c.reduction.tokensPercent.toFixed(1)}%)`);
  });

  // Save summary
  await writeFile(
    join(OUTPUT_DIR, 'optimization_summary.json'),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      comparisons,
      totals: {
        before: { sizeKB: totalBeforeSize / 1024, tokens: totalBeforeTokens },
        after: { sizeKB: totalAfterSize / 1024, tokens: totalAfterTokens },
        saved: {
          sizeKB: (totalBeforeSize - totalAfterSize) / 1024,
          sizePercent: ((totalBeforeSize - totalAfterSize) / totalBeforeSize) * 100,
          tokens: totalBeforeTokens - totalAfterTokens,
          tokensPercent: ((totalBeforeTokens - totalAfterTokens) / totalBeforeTokens) * 100
        }
      }
    }, null, 2)
  );

  console.log('\n✅ Comparison complete! Results saved to test-outputs/\n');

  await closeBrowser();
}

runComparison().catch(console.error);
