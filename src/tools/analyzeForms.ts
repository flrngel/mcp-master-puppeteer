import { getPage } from '../utils/browserManager.js';
import { analyzeForms as analyzePageForms } from '../utils/pageAnalyzer.js';
import { FormInfo } from '../types/index.js';

interface AnalyzeFormsResult {
  formCount: number;
  forms: FormInfo[];
  summary: {
    totalInputs: number;
    inputTypes: Record<string, number>;
    requiredFields: number;
    hasFileUpload: boolean;
    hasPasswordField: boolean;
    formPurposes: string[];
  };
}

export async function analyzeForms(): Promise<AnalyzeFormsResult> {
  const page = await getPage();
  const forms = await analyzePageForms(page);
  
  // Generate summary
  const summary = {
    totalInputs: 0,
    inputTypes: {} as Record<string, number>,
    requiredFields: 0,
    hasFileUpload: false,
    hasPasswordField: false,
    formPurposes: [] as string[]
  };
  
  forms.forEach(form => {
    // Try to guess form purpose
    const purpose = guessFormPurpose(form);
    if (purpose) {
      summary.formPurposes.push(purpose);
    }
    
    form.inputs.forEach(input => {
      summary.totalInputs++;
      
      // Count input types
      const type = input.type || 'text';
      summary.inputTypes[type] = (summary.inputTypes[type] || 0) + 1;
      
      // Count required fields
      if (input.required) {
        summary.requiredFields++;
      }
      
      // Check for special fields
      if (type === 'file') {
        summary.hasFileUpload = true;
      }
      if (type === 'password') {
        summary.hasPasswordField = true;
      }
    });
  });
  
  return {
    formCount: forms.length,
    forms,
    summary
  };
}

function guessFormPurpose(form: FormInfo): string | null {
  const action = form.action?.toLowerCase() || '';
  const inputNames = form.inputs.map(i => i.name?.toLowerCase() || '');
  const inputTypes = form.inputs.map(i => i.type?.toLowerCase() || '');
  
  // Check for login form
  if (action.includes('login') || action.includes('signin') ||
      (inputTypes.includes('password') && (inputNames.includes('username') || inputNames.includes('email')))) {
    return 'Login Form';
  }
  
  // Check for registration form
  if (action.includes('register') || action.includes('signup') ||
      (inputTypes.includes('password') && inputNames.includes('confirm'))) {
    return 'Registration Form';
  }
  
  // Check for contact form
  if (action.includes('contact') || 
      (inputNames.includes('message') && inputNames.includes('email'))) {
    return 'Contact Form';
  }
  
  // Check for search form
  if (action.includes('search') || inputNames.includes('search') || inputNames.includes('q')) {
    return 'Search Form';
  }
  
  // Check for newsletter
  if (action.includes('newsletter') || action.includes('subscribe') ||
      (form.inputs.length === 1 && inputTypes.includes('email'))) {
    return 'Newsletter Subscription';
  }
  
  // Check for file upload
  if (inputTypes.includes('file')) {
    return 'File Upload Form';
  }
  
  return null;
}