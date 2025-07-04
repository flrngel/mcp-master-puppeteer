import { getPage, executePageActions } from '../utils/browserManager.js';
import { ErrorCollector } from '../utils/errorCollector.js';
import { PageAction } from '../types/index.js';

interface BatchInteractArgs {
  actions: PageAction[];
  stopOnError?: boolean;
  captureStateAfterEach?: boolean;
}

interface ActionResult {
  action: PageAction;
  success: boolean;
  error?: string;
  pageState?: {
    url: string;
    title: string;
    consoleLogs?: string[];
  };
}

interface BatchInteractResult {
  results: ActionResult[];
  finalState: {
    url: string;
    title: string;
  };
  errors: any[];
  errorSummary: any;
}

export async function batchInteract(args: BatchInteractArgs): Promise<BatchInteractResult> {
  const { actions, stopOnError = false, captureStateAfterEach = false } = args;
  const page = await getPage();
  const errorCollector = new ErrorCollector(page);
  const results: ActionResult[] = [];
  const consoleLogs: string[] = [];
  
  // Set up console listener if capturing state
  if (captureStateAfterEach) {
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });
  }
  
  try {
    // Start error collection
    await errorCollector.start();
    
    // Execute each action
    for (const action of actions) {
      const actionResult: ActionResult = {
        action,
        success: false
      };
      
      try {
        // Clear console logs for this action
        if (captureStateAfterEach) {
          consoleLogs.length = 0;
        }
        
        // Execute single action
        await executePageActions(page, [action]);
        
        actionResult.success = true;
        
        // Capture state if requested
        if (captureStateAfterEach) {
          actionResult.pageState = {
            url: page.url(),
            title: await page.title(),
            consoleLogs: [...consoleLogs]
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
    
    return {
      results,
      finalState,
      errors: errorCollector.getErrors(),
      errorSummary: errorCollector.getSummary()
    };
    
  } catch (error) {
    errorCollector.stop();
    throw error;
  }
}