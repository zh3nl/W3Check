import OpenAI from 'openai';
import { ViolationType } from '../types';
import { aiConfig} from '../config/ai-config';

// Initialize OpenAI client
// In a real application, this would use environment variables for the API key
const openai = new OpenAI({
  baseURL: "https://api.novita.ai/v3/openai",
  apiKey: aiConfig.novitaAi.apiKey || 'demo-api-key', // Default to placeholder in development
});

// Map WCAG criteria to more descriptive explanations
const wcagExplanations: Record<string, string> = {
  'wcag2a': 'WCAG 2.0 Level A',
  'wcag2aa': 'WCAG 2.0 Level AA',
  'color-contrast': 'Text should have sufficient contrast with its background',
  'image-alt': 'Images should have alternative text',
  'link-name': 'Links should have descriptive text',
  'button-name': 'Buttons should have accessible names',
  'form-label': 'Form controls should have associated labels',
  'heading-order': 'Headings should be properly nested',
  'html-lang': 'HTML documents should specify the language',
  'landmark-one-main': 'Pages should have exactly one main landmark',
  'page-title': 'Pages should have titles that describe topic or purpose',
  'region': 'All content should be contained in landmarks',
  'document-title': 'Documents must have <title> element to aid navigation',
  'aria-roles': 'ARIA roles must be valid',
  'aria-required-attr': 'Elements with ARIA roles must have all required attributes',
  'aria-hidden-body': 'aria-hidden must not be used on the document body',
  'frame-title': 'Frames must have title attribute',
};

/**
 * Enhances accessibility violations with AI-powered suggestions
 * 
 * @param violation The accessibility violation to analyze
 * @param url The URL where the violation was found
 * @returns A string containing the AI-generated suggestion
 */
export async function enhanceWithAI(violation: ViolationType, url: string): Promise<string> {
  try {
    // In a demo version, we could return pre-defined suggestions for common issues
    if (process.env.NODE_ENV !== 'production' || !process.env.OPENAI_API_KEY) {
      return generateDemoSuggestion(violation);
    }
    
    // Prepare context for the AI
    const wcagInfo = violation.tags
      .map(tag => wcagExplanations[tag as keyof typeof wcagExplanations] || tag)
      .join(', ');
    
    const context = `
      URL: ${url}
      Violation: ${violation.id}
      Impact: ${violation.impact}
      Description: ${violation.description}
      WCAG Criteria: ${wcagInfo}
      
      ${violation.nodes.map((node, i) => `
        Element ${i+1}:
        HTML: ${node.html}
        Failure: ${node.failureSummary}
      `).join('\n')}
    `;
    
    // Generate AI suggestion
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: "You are an accessibility expert specializing in WCAG compliance. Provide clear, concise suggestions to fix accessibility issues. Explain what needs to be changed and why, with code examples where helpful. Make sure to format your responses without any markdown."
        },
        {
          role: "user",
          content: `Please provide a suggestion to fix this accessibility issue and format it so a human can read and understand it clearly:\n${context}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more focused, professional responses
    });
    
    return response.choices[0]?.message.content || 'No AI suggestion available';
    
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return 'Unable to generate AI suggestion at this time.';
  }
}

/**
 * Generates pre-defined suggestions for common accessibility issues
 * Used when OpenAI API is not available
 */
function generateDemoSuggestion(violation: ViolationType): string {
  const suggestions: Record<string, string> = {
    'color-contrast': 'Increase the contrast ratio between the text and background. Use a color contrast checker to ensure the ratio meets WCAG AA requirements (4.5:1 for normal text, 3:1 for large text).',
    
    'image-alt': 'Add descriptive alt text to the image that conveys its purpose or content. If the image is decorative, use alt="" to allow screen readers to skip it.',
    
    'link-name': 'Provide descriptive text for links instead of generic phrases like "click here" or "read more". The link text should make sense out of context and describe the destination.',
    
    'button-name': 'Add accessible text to the button that describes its action. Use the button text, aria-label, or aria-labelledby attributes.',
    
    'form-label': 'Associate labels with form controls using the "for" attribute matching the input\'s ID, or wrap the input with the label element.',
    
    'heading-order': 'Restructure headings to follow a logical hierarchy. Don\'t skip heading levels (e.g., h1 to h3) and start the page with h1.',
    
    'html-lang': 'Add a lang attribute to the html element to specify the language of the page, e.g., <html lang="en">.',
    
    'landmark-one-main': 'Add exactly one <main> element to the page to indicate the primary content area.',
    
    'page-title': 'Add a descriptive title element that clearly conveys the page\'s purpose or content.',
    
    'region': 'Ensure all content is contained within landmark regions like <header>, <nav>, <main>, <aside>, or <footer>, or sections with ARIA roles.'
  };
  
  return suggestions[violation.id] || 
    `Fix the ${violation.id} issue by ensuring the element meets WCAG ${violation.tags.join(', ')} criteria. Review the element and make sure it follows accessibility best practices.`;
} 