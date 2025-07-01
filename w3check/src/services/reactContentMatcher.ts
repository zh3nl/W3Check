import { ViolationType, JSXElement, MatchResult, ElementMatch, ReactFile } from '../types';
import { JSXParser } from './jsxParser';

export class ReactContentMatcher {
  private jsxParser: JSXParser;

  constructor() {
    this.jsxParser = new JSXParser();
    console.log('✓ ReactContentMatcher initialized with enhanced JSX parser');
  }

  /**
   * Match violations against JSX elements using multiple strategies
   */
  async matchViolationToJSXElements(
    violation: ViolationType, 
    reactFiles: ReactFile[]
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];

    for (const reactFile of reactFiles) {
      if (!reactFile.content) continue;

      try {
        const parsedFile = this.jsxParser.parseJSXFile(reactFile.content, reactFile.path);
        const relevantElements = this.jsxParser.extractAccessibilityRelevantElements(parsedFile.elements);

        // Try different matching strategies for each violation node
        for (const node of violation.nodes) {
          const nodeMatches = await this.findElementMatches(
            violation,
            node,
            relevantElements,
            reactFile.path
          );
          matches.push(...nodeMatches);
        }
      } catch (error) {
        console.error(`Error processing React file ${reactFile.path}:`, error);
      }
    }

    // Sort matches by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find elements that match a specific violation node using multiple strategies
   */
  private async findElementMatches(
    violation: ViolationType,
    node: { html: string; target: string[]; failureSummary: string },
    jsxElements: JSXElement[],
    filePath: string
  ): Promise<MatchResult[]> {
    const matches: MatchResult[] = [];

    for (const element of jsxElements) {
      // Strategy 1: Direct HTML matching
      const htmlMatch = this.tryHTMLMatch(node.html, element);
      if (htmlMatch.confidence > 0) {
        matches.push({
          violation,
          jsxElement: element,
          filePath,
          confidence: htmlMatch.confidence,
          matchType: htmlMatch.matchType
        });
        continue;
      }

      // Strategy 2: Semantic matching by element type and attributes
      const semanticMatch = this.trySemanticMatch(violation, node, element);
      if (semanticMatch.confidence > 0) {
        matches.push({
          violation,
          jsxElement: element,
          filePath,
          confidence: semanticMatch.confidence,
          matchType: semanticMatch.matchType
        });
        continue;
      }

      // Strategy 3: Fuzzy matching with attribute similarity
      const fuzzyMatch = this.tryFuzzyMatch(node.html, element);
      if (fuzzyMatch.confidence > 0) {
        matches.push({
          violation,
          jsxElement: element,
          filePath,
          confidence: fuzzyMatch.confidence,
          matchType: fuzzyMatch.matchType
        });
      }
    }

    return matches;
  }

  /**
   * Try direct HTML string matching
   */
  private tryHTMLMatch(violationHtml: string, jsxElement: JSXElement): { confidence: number; matchType: 'exact' | 'fuzzy' | 'semantic' } {
    const generatedHTML = this.jsxParser.generateHTMLFromJSX(jsxElement);
    
    // Normalize both HTML strings
    const normalize = (html: string) => html
      .replace(/\s+/g, ' ')
      .replace(/\s*=\s*/g, '=')
      .trim()
      .toLowerCase();

    const normalizedViolation = normalize(violationHtml);
    const normalizedGenerated = normalize(generatedHTML);

    // Exact match
    if (normalizedViolation === normalizedGenerated) {
      return { confidence: 1.0, matchType: 'exact' };
    }

    // Partial content match
    if (normalizedGenerated.includes(normalizedViolation) || 
        normalizedViolation.includes(normalizedGenerated)) {
      return { confidence: 0.8, matchType: 'fuzzy' };
    }

    return { confidence: 0, matchType: 'exact' };
  }

  /**
   * Try semantic matching based on violation type and element properties
   */
  private trySemanticMatch(
    violation: ViolationType,
    node: { html: string; target: string[]; failureSummary: string },
    jsxElement: JSXElement
  ): { confidence: number; matchType: 'exact' | 'fuzzy' | 'semantic' } {
    const violationId = violation.id;
    const elementType = jsxElement.type.toLowerCase();
    const props = jsxElement.props;

    let confidence = 0;

    // Match based on violation type and element type
    switch (violationId) {
      case 'image-alt':
        if (elementType === 'img') {
          confidence = 0.9;
          // Higher confidence if src matches
          if (this.extractAttribute(node.html, 'src') === props.src) {
            confidence = 0.95;
          }
        }
        break;

      case 'label':
      case 'label-title-only':
        if (['input', 'select', 'textarea'].includes(elementType)) {
          confidence = 0.8;
          // Higher confidence if type or name matches
          const htmlType = this.extractAttribute(node.html, 'type');
          const htmlName = this.extractAttribute(node.html, 'name');
          if ((htmlType && htmlType === props.type) || 
              (htmlName && htmlName === props.name)) {
            confidence = 0.9;
          }
        }
        break;

      case 'color-contrast':
        // Any visible element could have color contrast issues
        if (!['script', 'style', 'meta', 'link'].includes(elementType)) {
          confidence = 0.6;
          // Higher confidence if class or id matches
          const htmlClass = this.extractAttribute(node.html, 'class');
          const htmlId = this.extractAttribute(node.html, 'id');
          if ((htmlClass && htmlClass === props.className) || 
              (htmlId && htmlId === props.id)) {
            confidence = 0.8;
          }
        }
        break;

      case 'heading-order':
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(elementType)) {
          confidence = 0.9;
        }
        break;

      case 'landmark-one-main':
        if (elementType === 'main' || props.role === 'main') {
          confidence = 0.9;
        }
        break;

      case 'button-name':
        if (elementType === 'button' || props.role === 'button') {
          confidence = 0.85;
        }
        break;

      case 'link-name':
        if (elementType === 'a' || props.role === 'link') {
          confidence = 0.85;
        }
        break;

      default:
        // General matching based on element type
        const htmlElement = this.extractTagName(node.html);
        if (htmlElement === elementType) {
          confidence = 0.7;
        }
        break;
    }

    return confidence > 0 
      ? { confidence, matchType: 'semantic' }
      : { confidence: 0, matchType: 'semantic' };
  }

  /**
   * Try fuzzy matching with attribute similarity
   */
  private tryFuzzyMatch(violationHtml: string, jsxElement: JSXElement): { confidence: number; matchType: 'exact' | 'fuzzy' | 'semantic' } {
    const htmlInfo = this.parseHTMLElement(violationHtml);
    const jsxInfo = this.parseJSXElement(jsxElement);

    if (htmlInfo.tagName !== jsxInfo.tagName) {
      return { confidence: 0, matchType: 'fuzzy' };
    }

    // Calculate attribute similarity
    const htmlAttrs = Object.keys(htmlInfo.attributes);
    const jsxAttrs = Object.keys(jsxInfo.attributes);
    
    if (htmlAttrs.length === 0 && jsxAttrs.length === 0) {
      return { confidence: 0.5, matchType: 'fuzzy' }; // Same tag, no attributes
    }

    const allAttrs = new Set([...htmlAttrs, ...jsxAttrs]);
    let matchingAttrs = 0;
    let totalWeight = 0;

    for (const attr of allAttrs) {
      const weight = this.getAttributeWeight(attr);
      totalWeight += weight;

      const htmlValue = htmlInfo.attributes[attr];
      const jsxValue = jsxInfo.attributes[attr];

      if (htmlValue && jsxValue && htmlValue === jsxValue) {
        matchingAttrs += weight;
      }
    }

    const similarity = totalWeight > 0 ? matchingAttrs / totalWeight : 0;
    
    // Require at least 50% similarity for fuzzy match
    return similarity >= 0.5 
      ? { confidence: Math.min(0.85, similarity), matchType: 'fuzzy' }
      : { confidence: 0, matchType: 'fuzzy' };
  }

  /**
   * Parse HTML element to extract tag name and attributes
   */
  private parseHTMLElement(html: string): { tagName: string; attributes: Record<string, string> } {
    const tagMatch = html.match(/<(\w+)([^>]*)>/);
    if (!tagMatch) return { tagName: '', attributes: {} };

    const tagName = tagMatch[1].toLowerCase();
    const attributeString = tagMatch[2];

    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)(?:=["']([^"']*)["'])?/g;
    let match;

    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, attrName, attrValue] = match;
      attributes[attrName.toLowerCase()] = attrValue || '';
    }

    return { tagName, attributes };
  }

  /**
   * Parse JSX element to extract tag name and attributes
   */
  private parseJSXElement(jsxElement: JSXElement): { tagName: string; attributes: Record<string, string> } {
    const tagName = jsxElement.type.toLowerCase();
    const attributes: Record<string, string> = {};

    for (const [key, value] of Object.entries(jsxElement.props)) {
      let attrName = key.toLowerCase();
      
      // Convert JSX prop names to HTML attribute names
      if (key === 'className') attrName = 'class';
      if (key === 'htmlFor') attrName = 'for';
      
      attributes[attrName] = String(value || '');
    }

    return { tagName, attributes };
  }

  /**
   * Extract attribute value from HTML string
   */
  private extractAttribute(html: string, attributeName: string): string | null {
    const regex = new RegExp(`${attributeName}=["']([^"']*?)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Extract tag name from HTML string
   */
  private extractTagName(html: string): string {
    const match = html.match(/<(\w+)/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Get weight for attribute importance in matching
   */
  private getAttributeWeight(attributeName: string): number {
    const weights: Record<string, number> = {
      'id': 3,
      'class': 2,
      'src': 3,
      'href': 3,
      'type': 2,
      'name': 2,
      'alt': 3,
      'role': 2,
      'aria-label': 2,
      'aria-labelledby': 2,
      'aria-describedby': 2
    };

    return weights[attributeName.toLowerCase()] || 1;
  }

  /**
   * Find elements across component boundaries (simplified implementation)
   */
  async findElementAcrossComponents(
    violationHtml: string, 
    reactFiles: ReactFile[]
  ): Promise<ElementMatch[]> {
    const matches: ElementMatch[] = [];

    for (const reactFile of reactFiles) {
      if (!reactFile.content) continue;

      const parsedFile = this.jsxParser.parseJSXFile(reactFile.content, reactFile.path);
      const relevantElements = this.jsxParser.extractAccessibilityRelevantElements(parsedFile.elements);

      for (const element of relevantElements) {
        const generatedHTML = this.jsxParser.generateHTMLFromJSX(element);
        
        if (this.isContentSimilar(violationHtml, generatedHTML)) {
          matches.push({
            originalHtml: violationHtml,
            jsxElement: element,
            filePath: reactFile.path,
            transformations: this.getRequiredTransformations(violationHtml, element)
          });
        }
      }
    }

    return matches;
  }

  /**
   * Check if content is similar enough to consider a match
   */
  private isContentSimilar(html1: string, html2: string): boolean {
    const normalize = (html: string) => html
      .replace(/\s+/g, ' ')
      .replace(/['"]/g, '"')
      .trim()
      .toLowerCase();

    const norm1 = normalize(html1);
    const norm2 = normalize(html2);

    // Calculate simple similarity score
    const similarity = this.calculateStringSimilarity(norm1, norm2);
    return similarity > 0.6; // 60% similarity threshold
  }

  /**
   * Calculate string similarity using simple character comparison
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1.0;

    let matches = 0;
    const minLen = Math.min(len1, len2);

    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Get required transformations to convert JSX to matching HTML
   */
  private getRequiredTransformations(targetHtml: string, jsxElement: JSXElement): string[] {
    const transformations: string[] = [];
    
    const htmlInfo = this.parseHTMLElement(targetHtml);
    const jsxInfo = this.parseJSXElement(jsxElement);

    // Check for missing attributes
    for (const [attr, value] of Object.entries(htmlInfo.attributes)) {
      if (!jsxInfo.attributes[attr]) {
        transformations.push(`Add ${attr}="${value}"`);
      } else if (jsxInfo.attributes[attr] !== value) {
        transformations.push(`Change ${attr} from "${jsxInfo.attributes[attr]}" to "${value}"`);
      }
    }

    return transformations;
  }
} 