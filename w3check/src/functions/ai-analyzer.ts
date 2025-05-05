import OpenAI from 'openai';
import { ViolationType } from '../types';
import { aiConfig, isFeatureEnabled, isServiceConfigured } from '../config/ai-config';

// Initialize OpenAI client
const openai = new OpenAI({
  baseURL: "https://api.novita.ai/v3/openai",
  apiKey: aiConfig.novitaAi.apiKey || 'demo-api-key', // Default to placeholder in development
});

// Map WCAG success criteria to detailed explanations
const wcagCriteriaMap: Record<string, { level: string; url: string; explanation: string }> = {
  '1.1.1': {
    level: 'A',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    explanation: 'All non-text content has a text alternative that serves the equivalent purpose.'
  },
  '1.4.3': {
    level: 'AA',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
    explanation: 'Text has sufficient contrast against its background (at least 4.5:1 for normal text, 3:1 for large text).'
  },
  '2.4.4': {
    level: 'A',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',
    explanation: 'The purpose of each link can be determined from the link text alone.'
  },
  '3.3.2': {
    level: 'A',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
    explanation: 'Labels or instructions are provided when content requires user input.'
  },
  '4.1.2': {
    level: 'A',
    url: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    explanation: 'For all UI components, the name, role, and value can be programmatically determined.'
  }
};

// Map axe-core rule IDs to WCAG criteria
const axeToWcagMap: Record<string, string[]> = {
  'image-alt': ['1.1.1'],
  'color-contrast': ['1.4.3'],
  'link-name': ['2.4.4', '4.1.2'],
  'button-name': ['4.1.2'],
  'form-label': ['3.3.2', '4.1.2'],
  'aria-required-attr': ['4.1.2'],
  'aria-roles': ['4.1.2'],
  'aria-valid-attr': ['4.1.2'],
};

// Impact severity mapping for prioritization
const impactPriorityMap: Record<string, number> = {
  'critical': 1,
  'serious': 2,
  'moderate': 3,
  'minor': 4
};

/**
 * Analyze WCAG violations and enhance with AI-powered suggestions
 */
export async function analyzeAccessibilityViolations(
  violations: ViolationType[],
  pageUrl: string,
  pageContent: string
): Promise<ViolationType[]> {
  // Check if AI enhancement is enabled
  if (!isFeatureEnabled('enhanceViolations')) {
    return violations.map(violation => {
      // Add basic explanation if AI enhancement is disabled
      if (!violation.aiSuggestion) {
        violation.aiSuggestion = generateBasicSuggestion(violation);
      }
      return violation;
    });
  }

  // Sort violations by impact priority
  const prioritizedViolations = [...violations].sort(
    (a, b) => impactPriorityMap[a.impact] - impactPriorityMap[b.impact]
  );
  
  // Process each violation with AI enhancement
  const enhancedViolations = await Promise.all(
    prioritizedViolations.map(async (violation) => {
      try {
        // Determine which WCAG criteria apply to this violation
        const wcagCriteria = axeToWcagMap[violation.id] || [];
        
        // Add AI-powered enhancements based on violation type
        if (violation.id === 'image-alt' && isFeatureEnabled('generateAltText')) {
          // For missing alt text, generate suggestions with OpenAI Vision
          await enhanceImageAltViolation(violation, pageUrl);
        } else if ((violation.id.includes('aria') || violation.id === 'form-label') && 
                  isFeatureEnabled('suggestAriaFixes')) {
          // For ARIA and form issues, use Novita AI or OpenAI to suggest improvements
          await enhanceAriaViolation(violation, pageContent);
        } else {
          // For other violations, provide general AI-enhanced explanation
          await enhanceGeneralViolation(violation, wcagCriteria);
        }
        
        return violation;
      } catch (error) {
        console.error(`Error enhancing violation ${violation.id}:`, error);
        // Add a fallback suggestion if AI enhancement fails
        if (!violation.aiSuggestion) {
          violation.aiSuggestion = generateBasicSuggestion(violation);
        }
        return violation;
      }
    })
  );
  
  return enhancedViolations;
}

/**
 * Generate alt text suggestions for images
 */
async function enhanceImageAltViolation(
  violation: ViolationType,
  pageUrl: string
): Promise<void> {
  // Extract image URLs from violation nodes
  const imageUrls: string[] = [];
  
  for (const node of violation.nodes) {
    const match = node.html.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      let imageUrl = match[1];
      
      // Convert relative URLs to absolute
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(pageUrl);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      
      imageUrls.push(imageUrl);
    }
  }

  if (imageUrls.length === 0) {
    violation.aiSuggestion = 'Could not extract image URLs to generate alt text suggestions.';
    return;
  }

  try {
    // First image URL for analysis
    const imageUrl = imageUrls[0];
    let altTextSuggestion = '';
    
    // Use OpenAI Vision for alt text suggestion
    altTextSuggestion = await generateAltTextWithOpenAI(imageUrl);
    
    if (!altTextSuggestion) {
      violation.aiSuggestion = 'Could not generate alt text suggestion for the image.';
      return;
    }
    
    // Format the response with before/after examples
    const beforeCode = violation.nodes[0]?.html || '<img src="image.jpg">';
    const afterCode = beforeCode.replace(/alt=["'][^"']*["']|<img/, match => {
      return match === '<img' 
        ? `<img alt="${altTextSuggestion}"` 
        : `alt="${altTextSuggestion}"`;
    });
    violation.aiSuggestion = `Before: ${beforeCode}\nAfter: ${afterCode}`;
  } catch {
    violation.aiSuggestion = 'Error generating alt text suggestion.';
  }
}

/**
 * Generate alt text using OpenAI Vision API
 */
async function generateAltTextWithOpenAI(imageUrl: string): Promise<string> {
  try {
    // Using a text-only prompt as a workaround for image analysis
    // In a production environment, you'd use the actual vision API
    const prompt = `Describe this image concisely and accurately: ${imageUrl}`;
    
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: "You are an accessibility expert specializing in writing concise, descriptive alt text for images."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100
    });

    return response.choices[0]?.message.content || '';
  } catch (error) {
    console.error('Error calling OpenAI for alt text generation:', error);
    return '';
  }
}

/**
 * Enhance ARIA and form-related violations with AI
 */
async function enhanceAriaViolation(
  violation: ViolationType,
  pageContent: string
): Promise<void> {
  try {
    const elementHtml = violation.nodes[0]?.html || '';
    const failureSummary = violation.nodes[0]?.failureSummary || '';
    
    // Default to OpenAI
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: "You are an accessibility expert specializing in ARIA, semantic HTML, and form accessibility. Provide specific code fixes for accessibility issues."
        },
        {
          role: "user",
          content: `Fix this accessibility issue:
          
Element: ${elementHtml}
Issue: ${violation.description}
Failure: ${failureSummary}
Page Context: ${pageContent.length > 500 ? pageContent.substring(0, 500) + '...' : pageContent}

Provide a concise explanation in simple terms, specific code fix with before/after examples, and reference to WCAG guidelines.`
        }
      ],
      max_tokens: aiConfig.openai.maxTokens
    });

    const suggestion = response.choices[0]?.message.content || '';
    
    // Further process and structure the AI response
    violation.aiSuggestion = formatAiSuggestion(suggestion, violation);
    
  } catch (error) {
    console.error('Error enhancing ARIA violation with AI:', error);
    violation.aiSuggestion = 'Error generating AI-powered ARIA suggestion.';
  }
}

/**
 * Enhance general accessibility violations with AI context
 */
async function enhanceGeneralViolation(
  violation: ViolationType,
  wcagCriteria: string[]
): Promise<void> {
  try {
    // Get related WCAG criteria information
    const criteriaInfo = wcagCriteria.map(id => {
      const info = wcagCriteriaMap[id];
      return info 
        ? `WCAG ${id} (Level ${info.level}): ${info.explanation}`
        : `WCAG criterion related to ${violation.id}`;
    }).join('\n');
    
    // Extract element from first node
    const elementHtml = violation.nodes[0]?.html || '';
    const failureSummary = violation.nodes[0]?.failureSummary || '';
    
    const response = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: `You are an accessibility expert explaining WCAG violations in simple, non-technical language with clear code examples. Make sure to format your responses without any markdown`
        },
        {
          role: "user",
          content: `Explain this accessibility issue in simple terms and provide a fix. Please format it so that a human can understand it:
          
Element: ${elementHtml}
Issue: ${violation.description}
Failure: ${failureSummary}
WCAG Criteria: ${criteriaInfo}

Keep your explanation clear and non-technical. Include code examples showing before and after.`
        }
      ],
      max_tokens: aiConfig.openai.maxTokens
    });

    const suggestion = response.choices[0]?.message.content || '';
    
    // Format and enhance the suggestion
    violation.aiSuggestion = formatAiSuggestion(suggestion, violation);
    
  } catch (error) {
    console.error('Error enhancing general violation with AI:', error);
    violation.aiSuggestion = 'Error generating AI-powered suggestion.';
  }
}

/**
 * Format AI suggestions into a consistent structure
 */
function formatAiSuggestion(suggestion: string, violation: ViolationType): string {
  // Extract WCAG references from the suggestion or use defaults
  const wcagMatch = suggestion.match(/WCAG\s+(\d+\.\d+\.\d+)/i);
  const wcagRef = wcagMatch ? wcagMatch[1] : axeToWcagMap[violation.id]?.[0] || '';
  
  const wcagInfo = wcagRef ? wcagCriteriaMap[wcagRef] || null : null;
  const wcagLevel = wcagInfo ? `(Level ${wcagInfo.level})` : '';
  const wcagUrl = wcagInfo?.url || '#';
  
  // Ensure the suggestion has a consistent structure
  if (!suggestion.includes('## ') && !suggestion.includes('### ')) {
    return `
## Accessibility Issue: ${violation.id}

### Explanation
${suggestion}

### WCAG Reference
Violates [WCAG ${wcagRef} ${wcagLevel}](${wcagUrl})

### Priority: ${violation.impact.toUpperCase()}
${getPriorityDescription(violation.impact)}
`;
  }
  
  // If already formatted, just ensure WCAG and priority info is included
  let formattedSuggestion = suggestion;
  
  if (!suggestion.includes('WCAG Reference')) {
    formattedSuggestion += `

### WCAG Reference
Violates [WCAG ${wcagRef} ${wcagLevel}](${wcagUrl})
`;
  }
  
  if (!suggestion.includes('Priority:')) {
    formattedSuggestion += `

### Priority: ${violation.impact.toUpperCase()}
${getPriorityDescription(violation.impact)}
`;
  }
  
  return formattedSuggestion;
}

/**
 * Generate a basic suggestion when AI is not available
 */
function generateBasicSuggestion(violation: ViolationType): string {
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
  
  const wcagCriteria = axeToWcagMap[violation.id] || [];
  const wcagRef = wcagCriteria[0] || '';
  const wcagInfo = wcagRef ? wcagCriteriaMap[wcagRef] || null : null;
  const wcagLevel = wcagInfo ? `(Level ${wcagInfo.level})` : '';
  const wcagUrl = wcagInfo?.url || '#';
  
  const suggestion = suggestions[violation.id] || 
    `Fix the ${violation.id} issue by ensuring the element meets WCAG accessibility standards.`;
  
  return `
## Accessibility Issue: ${violation.id}

### Explanation
${suggestion}

### WCAG Reference
Violates [WCAG ${wcagRef} ${wcagLevel}](${wcagUrl})

### Priority: ${violation.impact.toUpperCase()}
${getPriorityDescription(violation.impact)}
`;
}

/**
 * Get human-readable description of impact priority
 */
function getPriorityDescription(impact: string): string {
  switch (impact) {
    case 'critical':
      return 'This issue prevents users with disabilities from accessing core functionality and must be fixed immediately.';
    case 'serious':
      return 'This issue creates significant barriers for users with disabilities and should be fixed as soon as possible.';
    case 'moderate':
      return 'This issue may create obstacles for some users with disabilities and should be addressed.';
    case 'minor':
      return 'This issue affects optimal experience for users with disabilities but does not prevent access.';
    default:
      return 'This issue impacts accessibility and should be reviewed.';
  }
} 