import { getPage } from '../utils/browserManager.js';
import { extractPageContent } from '../utils/htmlToMarkdown.js';
import { ExtractedContent } from '../types/index.js';

interface ExtractContentArgs {
  selector?: string; // Optional: extract from specific element
  includeHidden?: boolean; // Include hidden elements
}

export async function extractContent(args: ExtractContentArgs = {}): Promise<ExtractedContent> {
  const { selector, includeHidden = false } = args;
  const page = await getPage();
  
  if (selector) {
    // Extract from specific element using the existing extractPageContent
    // For now, just use the full page extraction
    // TODO: Implement selector-specific extraction
    return await extractPageContent(page);
  } else {
    // Extract from entire page
    return await extractPageContent(page);
  }
}