import Anthropic from '@anthropic-ai/sdk';
import { ViolationType } from '../types';
import { aiConfig, isFeatureEnabled} from '../config/ai-config';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: aiConfig.anthropic.apiKey || 'demo-api-key', // Default to placeholder in development
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

  // Group violations by type for batch processing
  const violationGroups = new Map<string, ViolationType[]>();
  
  prioritizedViolations.forEach(violation => {
    const groupKey = violation.id;
    if (!violationGroups.has(groupKey)) {
      violationGroups.set(groupKey, []);
    }
    violationGroups.get(groupKey)?.push(violation);
  });

  // Process each group of violations
  const enhancedViolations: ViolationType[] = [];
  
  for (const [groupKey, groupViolations] of violationGroups) {
    try {
      if (groupKey === 'image-alt' && isFeatureEnabled('generateAltText')) {
        // Process image alt violations in batches
        const imageViolations = await processImageAltViolations(groupViolations, pageUrl);
        enhancedViolations.push(...imageViolations);
      } else if ((groupKey.includes('aria') || groupKey === 'form-label') && 
                isFeatureEnabled('suggestAriaFixes')) {
        // Process ARIA violations in batches
        const ariaViolations = await processAriaViolations(groupViolations, pageContent);
        enhancedViolations.push(...ariaViolations);
      } else {
        // Process general violations in batches
        const generalViolations = await processGeneralViolations(groupViolations);
        enhancedViolations.push(...generalViolations);
      }
    } catch (error) {
      console.error(`Error processing violation group ${groupKey}:`, error);
      // Add fallback suggestions for failed batch
      groupViolations.forEach(violation => {
        if (!violation.aiSuggestion) {
          violation.aiSuggestion = generateBasicSuggestion(violation);
        }
        enhancedViolations.push(violation);
      });
    }
  }
  
  return enhancedViolations;
}

/**
 * Process a batch of image alt violations
 */
async function processImageAltViolations(
  violations: ViolationType[],
  pageUrl: string
): Promise<ViolationType[]> {
  // Extract all image URLs from violations
  const imageData = violations.map(violation => {
    const imageUrls: string[] = [];
    for (const node of violation.nodes) {
      const match = node.html.match(/src=["']([^"']+)["']/);
      if (match && match[1]) {
        let imageUrl = match[1];
        if (imageUrl.startsWith('/')) {
          const urlObj = new URL(pageUrl);
          imageUrl = `${urlObj.origin}${imageUrl}`;
        }
        imageUrls.push(imageUrl);
      }
    }
    return { violation, imageUrls };
  });

  // Filter out violations without image URLs
  const validImageData = imageData.filter(data => data.imageUrls.length > 0);
  
  if (validImageData.length === 0) {
    return violations.map(violation => {
      violation.aiSuggestion = 'Could not extract image URLs to generate alt text suggestions.';
      return violation;
    });
  }

  try {
    // Make a single API call for all images
    const prompt = `Generate concise, descriptive alt text for these images. Respond with ONLY the alt text for each image, numbered exactly as shown below:

${validImageData
      .map((data, index) => `${index + 1}. ${data.imageUrls[0]}`)
      .join('\n')}

Respond with ONLY the numbered list of alt text. No introductory text, no explanations, no additional commentary. Just:
1. [actual alt text]
2. [actual alt text]
etc.`;

    const response = await anthropic.messages.create({
      model: aiConfig.anthropic.defaultModel,
      max_tokens: aiConfig.anthropic.maxTokens,
      temperature: aiConfig.anthropic.temperature,
      system: "You are an accessibility expert. Provide ONLY concise, descriptive alt text for each image. Make sure that each alt text is no longer than 3 sentences long. Do not include any introductory text, explanations, or additional commentary. Each line should start with the number and contain only the alt text.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    // Debug: Log AI response
    console.log('=== AI ANALYZER DEBUG ===');
    console.log('AI raw response:', responseText);
    
    const suggestions = responseText.split('\n').filter(line => line.trim());
    console.log('Parsed suggestions:', suggestions);
    
    // Map suggestions back to violations
    validImageData.forEach((data, index) => {
      // Extract just the alt text part after the number
      let suggestion = suggestions[index]?.replace(/^\d+\.\s*/, '').trim() || '';
      console.log(`Processing suggestion ${index + 1}:`, suggestion);
      
             // Remove any remaining prefixes or unwanted text
       suggestion = suggestion.replace(/^(alt text:|description:|alt=["']?|["']$|here are|suggested)/gi, '').trim();
       console.log(`After cleanup:`, suggestion);
       
       // Remove quotes if they wrap the entire suggestion
       if ((suggestion.startsWith('"') && suggestion.endsWith('"')) || 
           (suggestion.startsWith("'") && suggestion.endsWith("'"))) {
         suggestion = suggestion.slice(1, -1);
       }
       
       // Filter out unwanted phrases that might be in the response
       const unwantedPhrases = [
         'suggested alt text',
         'description',
         'here are my',
         'here are the',
         'alt text for',
         'description for',
         'suggested descriptions'
       ];
       
       const hasUnwantedPhrase = unwantedPhrases.some(phrase => 
         suggestion.toLowerCase().includes(phrase.toLowerCase())
       );
       
       console.log(`Has unwanted phrase: ${hasUnwantedPhrase}`);
       console.log(`Suggestion length: ${suggestion.length}`);
       console.log(`Will generate AI suggestion: ${suggestion && suggestion.length > 0 && !hasUnwantedPhrase}`);
       
       if (suggestion && suggestion.length > 0 && !hasUnwantedPhrase) {
        const beforeCode = data.violation.nodes[0]?.html || '<img src="image.jpg">';
        const afterCode = beforeCode.replace(/alt=["'][^"']*["']|<img/, match => {
          return match === '<img' 
            ? `<img alt="${suggestion}"` 
            : `alt="${suggestion}"`;
        });
        data.violation.aiSuggestion = `Before: ${beforeCode}\nAfter: ${afterCode}`;
      } else {
        data.violation.aiSuggestion = 'Could not generate alt text suggestion for the image.';
      }
    });

    return violations;
  } catch (error) {
    console.error('Error processing image alt violations:', error);
    return violations.map(violation => {
      violation.aiSuggestion = 'Error generating alt text suggestion.';
      return violation;
    });
  }
}

/**
 * Process a batch of ARIA violations
 */
async function processAriaViolations(
  violations: ViolationType[],
  pageContent: string
): Promise<ViolationType[]> {
  try {
    // Prepare batch prompt
    const batchPrompt = violations.map((violation, index) => {
      const elementHtml = violation.nodes[0]?.html || '';
      const failureSummary = violation.nodes[0]?.failureSummary || '';
      return `
Issue ${index + 1}:
Element: ${elementHtml}
Issue: ${violation.description}
Failure: ${failureSummary}`;
    }).join('\n\n');

    const response = await anthropic.messages.create({
      model: aiConfig.anthropic.defaultModel,
      max_tokens: aiConfig.anthropic.maxTokens * violations.length,
      temperature: aiConfig.anthropic.temperature,
      system: "You are an accessibility expert specializing in ARIA, semantic HTML, and form accessibility. Provide specific code fixes for accessibility issues. Number your responses to match the input issues.",
      messages: [
        {
          role: "user",
          content: `Fix these accessibility issues:\n${batchPrompt}\n\nPage Context: ${pageContent.length > 500 ? pageContent.substring(0, 500) + '...' : pageContent}

For each issue, provide a concise explanation in simple terms, specific code fix with before/after examples, and reference to WCAG guidelines.`
        }
      ]
    });

    const suggestions = response.content[0]?.type === 'text' ? response.content[0].text.split(/\n(?=Issue \d+:)/) : [];
    
    // Map suggestions back to violations
    violations.forEach((violation, index) => {
      const suggestion = suggestions[index]?.replace(/^Issue \d+:\s*/, '') || '';
      if (suggestion) {
        violation.aiSuggestion = formatAiSuggestion(suggestion, violation);
      } else {
        violation.aiSuggestion = 'Error generating AI-powered ARIA suggestion.';
      }
    });

    return violations;
  } catch (error) {
    console.error('Error processing ARIA violations:', error);
    return violations.map(violation => {
      violation.aiSuggestion = 'Error generating AI-powered ARIA suggestion.';
      return violation;
    });
  }
}

/**
 * Process a batch of general violations
 */
async function processGeneralViolations(
  violations: ViolationType[]
): Promise<ViolationType[]> {
  try {
    // Prepare batch prompt
    const batchPrompt = violations.map((violation, index) => {
      const wcagCriteria = axeToWcagMap[violation.id] || [];
      const criteriaInfo = wcagCriteria.map(id => {
        const info = wcagCriteriaMap[id];
        return info 
          ? `WCAG ${id} (Level ${info.level}): ${info.explanation}`
          : `WCAG criterion related to ${violation.id}`;
      }).join('\n');

      const elementHtml = violation.nodes[0]?.html || '';
      const failureSummary = violation.nodes[0]?.failureSummary || '';
      
      return `
Issue ${index + 1}:
Element: ${elementHtml}
Issue: ${violation.description}
Failure: ${failureSummary}
WCAG Criteria: ${criteriaInfo}`;
    }).join('\n\n');

    const response = await anthropic.messages.create({
      model: aiConfig.anthropic.defaultModel,
      max_tokens: aiConfig.anthropic.maxTokens * violations.length,
      temperature: aiConfig.anthropic.temperature,
      system: "You are an accessibility expert explaining WCAG violations in simple, non-technical language with clear code examples. Number your responses to match the input issues.",
      messages: [
        {
          role: "user",
          content: `Explain these accessibility issues in simple terms and provide fixes:\n${batchPrompt}

For each issue, keep your explanation clear and non-technical. Include code examples showing before and after.`
        }
      ]
    });

    const suggestions = response.content[0]?.type === 'text' ? response.content[0].text.split(/\n(?=Issue \d+:)/) : [];
    
    // Map suggestions back to violations
    violations.forEach((violation, index) => {
      const suggestion = suggestions[index]?.replace(/^Issue \d+:\s*/, '') || '';
      if (suggestion) {
        violation.aiSuggestion = formatAiSuggestion(suggestion, violation);
      } else {
        violation.aiSuggestion = 'Error generating AI-powered suggestion.';
      }
    });

    return violations;
  } catch (error) {
    console.error('Error processing general violations:', error);
    return violations.map(violation => {
      violation.aiSuggestion = 'Error generating AI-powered suggestion.';
      return violation;
    });
  }
}

/**
 * Format AI suggestion with proper structure
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
 * Generate basic suggestion without AI enhancement
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
 * Get priority description based on impact level
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

export async function generateAISuggestion(violation: ViolationType): Promise<string> {
  try {
    console.log('🤖 Generating AI suggestion for violation:', violation);

    if (violation.id === 'image-alt') {
      // Extract image info from violation nodes
      for (const node of violation.nodes) {
        const match = node.html.match(/src=["']([^"']+)["']/);
        if (match && match[1]) {
          const imageSrc = match[1];
          console.log('🖼️ Processing image for alt text:', imageSrc);
          
          // Extract filename from image source
          const filename = imageSrc.split('/').pop() || imageSrc;
          
          // Get page context if available
          const elementContext = node.html;
          
          console.log('📄 Using context-based approach for image:', { filename, elementContext });
          
          const prompt = `Generate a descriptive alt text for an image with filename "${filename}".
          
Element context: ${elementContext}

The alt text should be:
- Descriptive and meaningful
- Concise (under 125 characters)
- Relevant to the page content and image filename
- Professional and accessible

Based on the filename "${filename}" and context, suggest appropriate alt text:`;

          const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 150,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          });

          console.log('🤖 Raw AI response:', response);

          const suggestion = response.content[0]?.type === 'text' 
            ? response.content[0].text.trim()
            : 'Add descriptive alt text for this image';

          console.log('✅ Generated alt text suggestion:', suggestion);
          
          // Clean up the suggestion (remove quotes if present)
          const cleanSuggestion = suggestion.replace(/^["']|["']$/g, '');
          
          return cleanSuggestion || `Descriptive alt text for ${filename}`;
        }
      }
    }

    // Handle other violation types...
    return generateBasicSuggestion(violation);
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return 'Error generating AI suggestion.';
  }
} 