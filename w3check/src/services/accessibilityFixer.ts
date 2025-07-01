import { ViolationType, CodeFix } from '../types';

export class AccessibilityFixer {
  generateCodeFixes(violations: ViolationType[], url: string): CodeFix[] {
    const fixes: CodeFix[] = [];
    
    violations.forEach(violation => {
      violation.nodes.forEach(node => {
        const fix = this.generateFixForViolation(violation, node);
        if (fix) {
          fixes.push(fix);
        }
      });
    });

    return fixes;
  }

  async findAndApplyFixes(violations: ViolationType[], url: string, htmlFiles: string[], getFileContent: (path: string) => Promise<string | null>): Promise<CodeFix[]> {
    const appliedFixes: CodeFix[] = [];
    
    console.log('=== ACCESSIBILITY FIXER DEBUG ===');
    console.log('Processing violations:', violations.length);
    console.log('HTML files to search:', htmlFiles);
    
    for (const violation of violations) {
      console.log(`\n--- Processing violation: ${violation.id} ---`);
      console.log('Violation nodes:', violation.nodes.length);
      
      for (const node of violation.nodes) {
        const nodeHtml = node.html.trim();
        console.log('Looking for HTML:', nodeHtml);
        
        // Search through all HTML files to find matching content
        for (const filePath of htmlFiles) {
          console.log(`Checking file: ${filePath}`);
          const fileContent = await getFileContent(filePath);
          
          if (fileContent) {
            console.log(`File content length: ${fileContent.length}`);
            console.log('File content preview:', fileContent.substring(0, 200) + '...');
            
            const hasExactMatch = fileContent.includes(nodeHtml);
            console.log(`Exact match found: ${hasExactMatch}`);
            
            // Try flexible HTML matching if exact match fails
            let matchFound = hasExactMatch;
            let matchingContent = nodeHtml;
            
            if (!hasExactMatch) {
              console.log('Trying flexible HTML matching...');
              const flexibleMatch = this.findFlexibleMatch(nodeHtml, fileContent);
              if (flexibleMatch) {
                console.log('✓ Flexible match found:', flexibleMatch);
                matchFound = true;
                matchingContent = flexibleMatch;
              }
            }
            
                          if (matchFound) {
                console.log('✓ Found matching content in file:', filePath);
                const fix = this.generateFixForViolation(violation, node);
              if (fix) {
                // Update the fix to use the actual file path
                fix.filePath = filePath;
                fix.originalContent = matchingContent;
                
                // Apply the fix to the full file content
                const updatedContent = fileContent.replace(matchingContent, fix.fixedContent);
                fix.fixedContent = updatedContent;
                fix.originalContent = fileContent;
                
                appliedFixes.push(fix);
                console.log('✓ Fix applied successfully');
                break; // Found the file, move to next violation
              } else {
                console.log('✗ Failed to generate fix');
              }
            } else {
              console.log('✗ No match in this file');
            }
          } else {
            console.log('✗ Could not read file content');
          }
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total fixes applied: ${appliedFixes.length}`);
    return appliedFixes;
  }

  private generateFixForViolation(violation: ViolationType, node: { html: string; target: string[]; failureSummary: string }): CodeFix | null {
    const violationId = violation.id;
    const html = node.html;
    
    // Use a temporary file path - this will be updated later when we find the actual file
    const filePath = 'temp-file.html';
    
    switch (violationId) {
      case 'image-alt':
        return this.fixMissingAltText(html, filePath, violation);
      
      case 'color-contrast':
        return this.fixColorContrast(html, filePath, violation);
      
      case 'label':
      case 'label-title-only':
        return this.fixMissingLabel(html, filePath, violation);
      
      case 'heading-order':
        return this.fixHeadingOrder(html, filePath, violation);
      
      case 'landmark-one-main':
        return this.fixMissingMain(html, filePath, violation);
      
      case 'region':
        return this.fixMissingRegion(html, filePath, violation);
      
      default:
        return this.generateGenericFix(html, filePath, violation);
    }
  }

  private fixMissingAltText(html: string, filePath: string, violation: ViolationType): CodeFix | null {
    const imgMatch = html.match(/<img[^>]*>/i);
    if (!imgMatch) return null;
    
    const img = imgMatch[0];
    const srcMatch = img.match(/src=['"]([^'"]*)['"]/i);
    const fileName = srcMatch ? srcMatch[1].split('/').pop() : 'image';
    
    const fixedHtml = img.includes('alt=') 
      ? img.replace(/alt=['"][^'"]*['"]/, `alt="Description of ${fileName}"`)
      : img.replace(/\/?>/, ` alt="Description of ${fileName}">`);
    
    return {
      filePath,
      originalContent: html,
      fixedContent: html.replace(img, fixedHtml),
      description: `Add alt text to image: ${fileName}`,
      violationsFixed: [violation.id]
    };
  }

  private fixColorContrast(html: string, filePath: string, violation: ViolationType): CodeFix {
    // For color contrast, we'll suggest CSS changes
    const cssFilePath = filePath.replace(/\.html?$/, '.css') || 'styles.css';
    
    const elementMatch = html.match(/<(\w+)[^>]*class=['"]([^'"]*)['"]/i);
    const className = elementMatch ? `.${elementMatch[2].split(' ')[0]}` : '.low-contrast-element';
    
    const cssRule = `
${className} {
  /* Improved color contrast for accessibility */
  color: #333333; /* Dark text for better contrast */
  background-color: #ffffff; /* Light background */
}`;

    return {
      filePath: cssFilePath,
      originalContent: '/* Add this CSS rule for better contrast */',
      fixedContent: cssRule,
      description: `Improve color contrast for element with class "${className}"`,
      violationsFixed: [violation.id]
    };
  }

  private fixMissingLabel(html: string, filePath: string, violation: ViolationType): CodeFix | null {
    const inputMatch = html.match(/<(input|select|textarea)[^>]*>/i);
    if (!inputMatch) return null;
    
    const element = inputMatch[0];
    const typeMatch = element.match(/type=['"]([^'"]*)['"]/i);
    const inputType = typeMatch ? typeMatch[1] : 'text';
    
    const labelText = this.generateLabelText(inputType);
    const inputId = this.generateId();
    
    const fixedElement = element.includes('id=') 
      ? element 
      : element.replace(/\/?>/, ` id="${inputId}">`);
    
    const labeledHtml = `<label for="${inputId}">${labelText}</label>\n${fixedElement}`;
    
    return {
      filePath,
      originalContent: html,
      fixedContent: html.replace(element, labeledHtml),
      description: `Add label for ${inputType} input`,
      violationsFixed: [violation.id]
    };
  }

  private fixHeadingOrder(html: string, filePath: string, violation: ViolationType): CodeFix | null {
    const headingMatch = html.match(/<h([1-6])[^>]*>/i);
    if (!headingMatch) return null;
    
    const currentLevel = parseInt(headingMatch[1]);
    const suggestedLevel = Math.max(1, currentLevel - 1);
    
    const fixedHtml = html.replace(
      new RegExp(`<h${currentLevel}`, 'gi'), 
      `<h${suggestedLevel}`
    ).replace(
      new RegExp(`</h${currentLevel}>`, 'gi'), 
      `</h${suggestedLevel}>`
    );
    
    return {
      filePath,
      originalContent: html,
      fixedContent: fixedHtml,
      description: `Fix heading order: change h${currentLevel} to h${suggestedLevel}`,
      violationsFixed: [violation.id]
    };
  }

  private fixMissingMain(html: string, filePath: string, violation: ViolationType): CodeFix | null {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (!bodyMatch) return null;
    
    const bodyContent = bodyMatch[1];
    const wrappedContent = `<main role="main">\n${bodyContent.trim()}\n</main>`;
    
    return {
      filePath,
      originalContent: html,
      fixedContent: html.replace(bodyContent, wrappedContent),
      description: 'Add main landmark to page content',
      violationsFixed: [violation.id]
    };
  }

  private fixMissingRegion(html: string, filePath: string, violation: ViolationType): CodeFix {
    // Wrap content in a section with appropriate role
    const wrappedHtml = `<section role="region" aria-label="Content section">\n${html}\n</section>`;
    
    return {
      filePath,
      originalContent: html,
      fixedContent: wrappedHtml,
      description: 'Add region landmark for content organization',
      violationsFixed: [violation.id]
    };
  }

  private generateGenericFix(html: string, filePath: string, violation: ViolationType): CodeFix {
    return {
      filePath,
      originalContent: html,
      fixedContent: `<!-- Accessibility Issue: ${violation.description} -->\n<!-- Please review: ${violation.helpUrl} -->\n${html}`,
      description: `Add accessibility comment for: ${violation.description}`,
      violationsFixed: [violation.id]
    };
  }

  private extractFilePathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      // Convert URL path to likely file path
      if (path === '/' || path === '') {
        return 'index.html';
      }
      
      if (!path.includes('.')) {
        return `${path.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
      }
      
      return path.replace(/^\//, '');
    } catch {
      return 'index.html';
    }
  }

  private generateLabelText(inputType: string): string {
    const labelMap: { [key: string]: string } = {
      'text': 'Enter text',
      'email': 'Email address',
      'password': 'Password',
      'tel': 'Phone number',
      'url': 'Website URL',
      'search': 'Search',
      'number': 'Enter number',
      'date': 'Select date',
      'time': 'Select time',
      'checkbox': 'Check this option',
      'radio': 'Select option',
      'file': 'Choose file'
    };
    
    return labelMap[inputType] || 'Enter value';
  }

  private generateId(): string {
    return `field-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Find flexible HTML matches to handle different syntax variations
   */
  private findFlexibleMatch(nodeHtml: string, fileContent: string): string | null {
    console.log('🔍 Flexible matching for:', nodeHtml);
    
    // Handle image tag variations (self-closing vs regular, spaces, quotes)
    const imgMatch = nodeHtml.match(/<img[^>]*>/i);
    if (imgMatch) {
      const originalImg = imgMatch[0];
      console.log('📸 Processing image tag:', originalImg);
      
      // Extract src attribute
      const srcMatch = originalImg.match(/src=['"]([^'"]*)['"]/i);
      if (srcMatch) {
        const src = srcMatch[1];
        console.log('🖼️ Image src:', src);
        
        // Try different variations of the image tag
        const patterns = [
          // Self-closing variations
          `<img[^>]*src=['"]${this.escapeRegex(src)}['"][^>]*\\s*\\/>`,
          `<img[^>]*src=['"]${this.escapeRegex(src)}['"][^>]*>`,
          // Different quote styles
          `<img[^>]*src="${this.escapeRegex(src)}"[^>]*\\s*\\/>`,
          `<img[^>]*src='${this.escapeRegex(src)}'[^>]*\\s*\\/>`,
          `<img[^>]*src="${this.escapeRegex(src)}"[^>]*>`,
          `<img[^>]*src='${this.escapeRegex(src)}'[^>]*>`,
        ];
        
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'i');
          const match = fileContent.match(regex);
          if (match) {
            console.log('✅ Found flexible match with pattern:', pattern);
            console.log('✅ Matched content:', match[0]);
            return match[0];
          }
        }
        
        // Try attribute-based matching as fallback
        const attrPattern = `<img[^>]*src=['"]${this.escapeRegex(src)}['"][^>]*`;
        const attrRegex = new RegExp(attrPattern, 'i');
        const attrMatch = fileContent.match(attrRegex);
        if (attrMatch) {
          console.log('✅ Found attribute-based match:', attrMatch[0]);
          return attrMatch[0];
        }
      }
    }
    
    // Handle other HTML elements with flexible matching
    const tagMatch = nodeHtml.match(/<(\w+)[^>]*>/i);
    if (tagMatch) {
      const tagName = tagMatch[1];
      console.log('🏷️ Processing tag:', tagName);
      
      // Try to match by tag name and key attributes
      const tagPattern = `<${tagName}[^>]*>`;
      const tagRegex = new RegExp(tagPattern, 'gi');
      const matches = Array.from(fileContent.matchAll(tagRegex));
      
      // Score matches by similarity
      for (const match of matches) {
        const similarity = this.calculateSimilarity(nodeHtml, match[0]);
        console.log(`🔄 Similarity for "${match[0]}": ${similarity}`);
        if (similarity > 0.7) { // 70% similarity threshold
          console.log('✅ Found similar match:', match[0]);
          return match[0];
        }
      }
    }
    
    console.log('❌ No flexible match found');
    return null;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate similarity between two HTML strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    // Normalize whitespace and remove quotes for comparison
    const normalize = (s: string) => s.replace(/\s+/g, ' ').replace(/['"]/g, '"').trim().toLowerCase();
    
    const norm1 = normalize(str1);
    const norm2 = normalize(str2);
    
    if (norm1 === norm2) return 1.0;
    
    // Calculate Levenshtein distance
    const len1 = norm1.length;
    const len2 = norm2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = norm1[i - 1] === norm2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator   // substitution
        );
      }
    }
    
    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1.0 : (maxLen - distance) / maxLen;
  }
} 