import puppeteer, { Browser, Page } from 'puppeteer';

let browserInstance: Browser | null = null;
let currentPage: Page | null = null;

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    const args = process.env.DOCKER_CONTAINER 
      ? ['--no-sandbox', '--disable-setuid-sandbox'] 
      : [];
    
    // Support custom puppeteer args from environment
    let customArgs = {};
    if (process.env.PUPPETEER_ARGS) {
      try {
        customArgs = JSON.parse(process.env.PUPPETEER_ARGS);
      } catch (error) {
        console.error('Error parsing PUPPETEER_ARGS:', error);
      }
    }
    
    browserInstance = await puppeteer.launch({
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args,
      ...customArgs
    });
  }
  
  return browserInstance;
}

export async function getPage(): Promise<Page> {
  const browser = await getBrowser();
  
  if (!currentPage || currentPage.isClosed()) {
    const pages = await browser.pages();
    currentPage = pages[0] || await browser.newPage();
  }
  
  return currentPage;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    currentPage = null;
  }
}

export async function executePageActions(page: Page, actions: any[]): Promise<void> {
  for (const action of actions) {
    switch (action.type) {
      case 'click':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
        await page.click(action.selector);
        break;
        
      case 'type':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
        await page.type(action.selector, action.text || action.value || '');
        break;
        
      case 'select':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
        await page.select(action.selector, action.value || '');
        break;
        
      case 'hover':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
        await page.hover(action.selector);
        break;
        
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, action.duration || 1000));
        break;
        
      case 'waitForSelector':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
        break;
        
      case 'scroll':
        if (action.position) {
          await page.evaluate((x, y) => window.scrollTo(x, y), action.position.x, action.position.y);
        } else if (action.selector) {
          await page.evaluate((selector) => {
            document.querySelector(selector)?.scrollIntoView();
          }, action.selector);
        }
        break;
        
      case 'clear':
        await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
        await page.evaluate((selector) => {
          const element = document.querySelector(selector) as HTMLInputElement;
          if (element) element.value = '';
        }, action.selector);
        break;
        
      case 'press':
        await page.keyboard.press(action.key || 'Enter');
        break;
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
    
    // Small delay between actions for stability
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}