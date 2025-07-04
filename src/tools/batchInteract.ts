import { getPage, executePageActions } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { PageAction } from '../types/index.js';
import { BatchInteractOptions, BatchInteractResult } from '../types/enhanced.js';

export async function batchInteract(args: BatchInteractOptions): Promise<BatchInteractResult> {
  const { actions, stopOnError = false } = args;
  const page = await getPage();
  const errorCollector = new ErrorCollector(page);
  const results: any[] = [];
  
  try {
    // Start error collection
    await errorCollector.start();
    
    // Execute each action
    for (const action of actions) {
      const previousUrl = page.url();
      const previousTitle = await page.title();
      
      const actionResult: any = {
        action,
        success: false
      };
      
      try {
        // Execute single action
        await executePageActions(page, [action]);
        
        actionResult.success = true;
        
        // Check if page changed
        const currentUrl = page.url();
        const currentTitle = await page.title();
        
        if (currentUrl !== previousUrl || currentTitle !== previousTitle) {
          actionResult.pageChanged = {
            newUrl: currentUrl,
            newTitle: currentTitle
          };
        }
        
      } catch (error) {
        actionResult.success = false;
        actionResult.error = error instanceof Error ? error.message : String(error);
        
        if (stopOnError) {
          results.push(actionResult);
          break;
        }
      }
      
      results.push(actionResult);
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
    
    return result;
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}