#!/usr/bin/env node

// Manual test script to verify navigation control features
import { batchInteract } from '../src/tools/batchInteract.js';
import { navigateAnalyze } from '../src/tools/navigateAnalyze.js';
import { closeBrowser } from '../src/utils/browserManager.js';

async function testNavigationControl() {
  console.log('🧪 Testing Navigation Control Features\n');
  
  try {
    // Test 1: Normal interaction with navigation (returnNavigationInfo: true)
    console.log('Test 1: Normal interaction with navigation info collection');
    // First navigate to example.com
    await navigateAnalyze({ url: 'https://example.com', contentFormat: 'none' });
    
    const result1 = await batchInteract({
      actions: [
        { type: 'click', selector: 'a[href*="iana.org"]' } // Click "More information..." link
      ],
      returnNavigationInfo: true
    });
    
    console.log('Result 1:', JSON.stringify(result1, null, 2));
    console.log('---\n');
    
    // Test 2: Prevent navigation
    console.log('Test 2: Prevent navigation during interaction');
    // Navigate back to example.com
    await navigateAnalyze({ url: 'https://example.com', contentFormat: 'none' });
    
    const result2 = await batchInteract({
      actions: [
        { type: 'click', selector: 'a[href*="iana.org"]' } // Try to click link
      ],
      preventNavigation: true
    });
    
    console.log('Result 2:', JSON.stringify(result2, null, 2));
    console.log('Navigation prevented count:', result2.navigationsPrevented || 0);
    console.log('---\n');
    
    // Test 3: Form submission with navigation info
    console.log('Test 3: Form submission with navigation tracking');
    // Navigate to httpbin form
    await navigateAnalyze({ url: 'https://httpbin.org/forms/post', contentFormat: 'none' });
    
    const result3 = await batchInteract({
      actions: [
        { type: 'type', selector: 'input[name="custname"]', text: 'Test User' },
        { type: 'type', selector: 'textarea[name="comments"]', text: 'Test comment' },
        { type: 'click', selector: 'button[type="submit"]' }
      ],
      returnNavigationInfo: true
    });
    
    console.log('Result 3:', JSON.stringify(result3, null, 2));
    console.log('---\n');
    
    // Test 4: Click that causes redirect
    console.log('Test 4: Click action that causes redirect');
    // Create a simple test page with redirect link
    await navigateAnalyze({ 
      url: 'data:text/html,<a href="https://httpbin.org/redirect/2">Click for redirect</a>', 
      contentFormat: 'none' 
    });
    
    const result4 = await batchInteract({
      actions: [
        { type: 'click', selector: 'a[href*="redirect"]' } // Click redirect link
      ],
      returnNavigationInfo: true
    });
    
    console.log('Result 4:', JSON.stringify(result4, null, 2));
    console.log('---\n');
    
    // Test 5: Disable navigation info collection
    console.log('Test 5: Disable navigation info collection');
    // Navigate back to example.com
    await navigateAnalyze({ url: 'https://example.com', contentFormat: 'none' });
    
    const result5 = await batchInteract({
      actions: [
        { type: 'click', selector: 'a[href*="iana.org"]' }
      ],
      returnNavigationInfo: false // Explicitly disable navigation info
    });
    
    console.log('Result 5 (no navigation info):', JSON.stringify(result5, null, 2));
    console.log('---\n');
    
    // Test 6: Multiple actions where only some cause navigation
    console.log('Test 6: Multiple actions with mixed navigation');
    // Create test page with form and link
    await navigateAnalyze({ 
      url: 'data:text/html,<input id="test"><button onclick="document.getElementById(\'test\').value=\'clicked\'">No Nav</button><a href="https://example.com">Navigate</a>', 
      contentFormat: 'none' 
    });
    
    const result6 = await batchInteract({
      actions: [
        { type: 'type', selector: '#test', text: 'Hello' },
        { type: 'click', selector: 'button' }, // No navigation
        { type: 'click', selector: 'a[href]' } // Will navigate
      ],
      returnNavigationInfo: true
    });
    
    console.log('Result 6:', JSON.stringify(result6, null, 2));
    console.log('---\n');
    
    console.log('✅ All navigation control tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await closeBrowser();
    process.exit(0);
  }
}

// Run the test
testNavigationControl().catch(console.error);