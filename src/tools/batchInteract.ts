import { getPage, executePageActions } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { PageAction } from '../types/index.js';
import { BatchInteractOptions, BatchInteractResult, NavigationInfo } from '../types/enhanced.js';

export async function batchInteract(args: BatchInteractOptions): Promise<BatchInteractResult> {
  const { 
    actions, 
    stopOnError = false,
    preventNavigation = false,
    returnNavigationInfo = true
  } = args;
  const page = await getPage();
  const errorCollector = new ErrorCollector(page);
  const results: any[] = [];
  let navigationsPrevented = 0;
  
  try {
    // Start error collection
    await errorCollector.start();
    
    // Set up navigation prevention if requested
    if (preventNavigation) {
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
          request.abort();
          navigationsPrevented++;
        } else {
          request.continue();
        }
      });
    }
    
    // Execute each action
    for (const action of actions) {
      const previousUrl = page.url();
      const previousTitle = await page.title();
      const redirectChain: string[] = [];
      let navigationStartTime: number | undefined;
      let navigationResponse: any = null;
      
      const actionResult: any = {
        action,
        success: false
      };
      
      // Set up redirect tracking if we're collecting navigation info
      if (returnNavigationInfo && !preventNavigation) {
        const responseHandler = (response: any) => {
          if (response.status() >= 300 && response.status() < 400) {
            const location = response.headers()['location'];
            if (location) {
              redirectChain.push(location);
            }
          }
          // Capture the main frame navigation response
          if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) {
            navigationResponse = response;
          }
        };
        page.on('response', responseHandler);
        
        // Track navigation start time
        page.once('framenavigated', () => {
          if (!navigationStartTime) {
            navigationStartTime = Date.now();
          }
        });
      }
      
      try {
        // Execute single action
        await executePageActions(page, [action]);
        
        actionResult.success = true;
        
        // Wait a bit to catch any navigation that might be starting
        await page.waitForTimeout(100);
        
        // Check if page changed
        const currentUrl = page.url();
        const currentTitle = await page.title();
        
        if (currentUrl !== previousUrl || currentTitle !== previousTitle) {
          actionResult.pageChanged = {
            newUrl: currentUrl,
            newTitle: currentTitle
          };
          
          // Add navigation info if requested and navigation occurred
          if (returnNavigationInfo && !preventNavigation) {
            const navigationInfo: NavigationInfo = {
              fromUrl: previousUrl,
              toUrl: currentUrl,
              title: currentTitle
            };
            
            // Add status code if we captured a navigation response
            if (navigationResponse) {
              navigationInfo.statusCode = navigationResponse.status();
            }
            
            // Add redirect chain if any
            if (redirectChain.length > 0) {
              navigationInfo.redirectChain = redirectChain;
            }
            
            // Add navigation time if we tracked it
            if (navigationStartTime) {
              navigationInfo.navigationTimeMs = Date.now() - navigationStartTime;
            }
            
            actionResult.navigationInfo = navigationInfo;
          }
        }
        
      } catch (error) {
        actionResult.success = false;
        actionResult.error = error instanceof Error ? error.message : String(error);
        
        if (stopOnError) {
          results.push(actionResult);
          break;
        }
      } finally {
        // Clean up event listeners
        if (returnNavigationInfo && !preventNavigation) {
          page.removeAllListeners('response');
          page.removeAllListeners('framenavigated');
        }
      }
      
      results.push(actionResult);
    }
    
    // Clean up request interception
    if (preventNavigation) {
      await page.setRequestInterception(false);
      page.removeAllListeners('request');
    }
    
    // Get final state
    const finalState = {
      url: page.url(),
      title: await page.title()
    };
    
    // Stop error collection
    errorCollector.stop();
    
    // Get errors if any
    const errors = errorCollector.getErrors();
    
    // Build minimal result
    const result: BatchInteractResult = {
      results,
      finalState
    };
    
    // Only add errors if there are any
    if (errors.length > 0) {
      result.errors = errors;
    }
    
    // Add navigationsPrevented if any
    if (navigationsPrevented > 0) {
      result.navigationsPrevented = navigationsPrevented;
    }
    
    return result;
    
  } catch (error) {
    errorCollector.stop();
    // Clean up if we set up request interception
    if (preventNavigation) {
      await page.setRequestInterception(false);
      page.removeAllListeners('request');
    }
    throw error;
  }
}