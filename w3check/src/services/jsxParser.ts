import { JSXElement, ParsedJSXFile } from '../types';

export class JSXParser {
  private babelAvailable = false;
  private parse: any;
  private traverse: any;
  private types: any;

  constructor() {
    this.initializeBabel();
  }

  private initializeBabel() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.parse = require('@babel/parser').parse;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.traverse = require('@babel/traverse').default;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.types = require('@babel/types');
      this.babelAvailable = true;
      console.log('✓ Enhanced Babel JSX parsing enabled');
    } catch (error) {
      console.warn('⚠️ Babel not available, using regex fallback');
      this.babelAvailable = false;
    }
  }

  /**
   * Parse a JSX/TSX file and extract React elements using enhanced parsing
   */
  parseJSXFile(content: string, filePath: string): ParsedJSXFile {
    if (this.babelAvailable) {
      return this.parseWithBabel(content, filePath);
    } else {
      return this.parseWithRegex(content, filePath);
    }
  }

  private parseWithBabel(content: string, filePath: string): ParsedJSXFile {
    try {
      const ast = this.parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx', 'decorators-legacy']
      });

      const elements: JSXElement[] = [];
      const imports: string[] = [];
      const exports: string[] = [];

      this.traverse(ast, {
        ImportDeclaration: (path: any) => {
          imports.push(path.node.source.value);
        },
        
        JSXElement: (path: any) => {
          const jsxElement = this.convertASTToJSXElement(path.node, content);
          if (jsxElement) {
            elements.push(jsxElement);
          }
        }
      });

      return {
        filePath,
        elements,
        imports,
        exports,
        hasAccessibilityIssues: this.hasAccessibilityIssues(elements)
      };
    } catch (error) {
      console.warn(`Babel parsing failed for ${filePath}, falling back to regex:`, error);
      return this.parseWithRegex(content, filePath);
    }
  }

  private parseWithRegex(content: string, filePath: string): ParsedJSXFile {
    const elements = this.extractJSXElementsRegex(content);
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);

    return {
      filePath,
      elements,
      imports,
      exports,
      hasAccessibilityIssues: this.hasAccessibilityIssues(elements)
    };
  }

  /**
   * Generate HTML representation from JSX element with enhanced accuracy
   */
  generateHTMLFromJSX(jsxElement: JSXElement): string {
    const { type, props, children } = jsxElement;
    
    // Handle React fragments
    if (type === 'React.Fragment' || type === 'Fragment' || type === '') {
      return children.map(child => this.generateHTMLFromJSX(child)).join('');
    }

    // Convert JSX props to HTML attributes with better handling
    const htmlAttributes = this.convertJSXPropsToHTML(props);
    const attributeString = Object.entries(htmlAttributes)
      .map(([key, value]) => {
        if (value === true) return key;
        if (value === false || value === null || value === undefined) return '';
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          // Handle JSX expressions - for HTML generation, use placeholder
          return `${key}="[expression]"`;
        }
        return `${key}="${String(value)}"`;
      })
      .filter(Boolean)
      .join(' ');

    // Handle self-closing tags
    const selfClosingTags = [
      'img', 'input', 'br', 'hr', 'meta', 'link', 'area', 
      'base', 'col', 'embed', 'source', 'track', 'wbr'
    ];
    
    if (selfClosingTags.includes(type.toLowerCase())) {
      return attributeString 
        ? `<${type} ${attributeString} />`
        : `<${type} />`;
    }

    // Generate opening tag
    const openingTag = attributeString 
      ? `<${type} ${attributeString}>`
      : `<${type}>`;

    // Generate children HTML
    const childrenHTML = children
      .map(child => this.generateHTMLFromJSX(child))
      .join('');

    return `${openingTag}${childrenHTML}</${type}>`;
  }

  /**
   * Enhanced accessibility-relevant element extraction
   */
  extractAccessibilityRelevantElements(elements: JSXElement[]): JSXElement[] {
    const accessibilityRelevantTags = [
      'img', 'input', 'button', 'a', 'form', 'label', 'select', 'textarea',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'main', 'section', 'article',
      'aside', 'header', 'footer', 'dialog', 'iframe', 'video', 'audio',
      'table', 'th', 'td', 'caption', 'fieldset', 'legend', 'details', 'summary',
      'figure', 'figcaption', 'time', 'progress', 'meter'
    ];

    const accessibilityProps = [
      'alt', 'aria-label', 'aria-labelledby', 'aria-describedby', 'role',
      'tabIndex', 'onClick', 'onKeyDown', 'onKeyPress', 'onFocus', 'onBlur',
      'aria-hidden', 'aria-expanded', 'aria-current', 'aria-live', 'aria-atomic',
      'aria-relevant', 'aria-busy', 'aria-disabled', 'aria-invalid'
    ];

    return elements.filter(element => {
      // Check if the element type is accessibility relevant
      if (accessibilityRelevantTags.includes(element.type.toLowerCase())) {
        return true;
      }

      // Check if element has accessibility-related props
      return Object.keys(element.props).some(prop => 
        accessibilityProps.some(accProp => 
          prop.toLowerCase().includes(accProp.toLowerCase())
        )
      );
    });
  }

  /**
   * Find JSX elements that match a specific HTML violation
   */
  findMatchingJSXElements(violationHtml: string, jsxElements: JSXElement[]): JSXElement[] {
    const matches: JSXElement[] = [];

    for (const element of jsxElements) {
      const generatedHTML = this.generateHTMLFromJSX(element);
      
      if (this.isHTMLMatch(violationHtml, generatedHTML)) {
        matches.push(element);
      }
    }

    return matches;
  }

  private convertASTToJSXElement(node: any, sourceCode: string): JSXElement | null {
    if (!this.babelAvailable) return null;

    try {
      const elementName = this.types.isJSXIdentifier(node.openingElement.name) 
        ? node.openingElement.name.name 
        : 'unknown';
      
      const props: Record<string, string | number | boolean | null | undefined> = {};
      for (const attr of node.openingElement.attributes) {
        if (this.types.isJSXAttribute(attr) && this.types.isJSXIdentifier(attr.name)) {
          const propName = attr.name.name;
          const propValue = this.getJSXAttributeValue(attr.value);
          props[propName] = propValue;
        }
      }

      const line = node.loc?.start.line || 0;
      const column = node.loc?.start.column || 0;
      const start = node.start || 0;
      const end = node.end || start;
      const raw = sourceCode.slice(start, end);

      return {
        type: elementName,
        props,
        children: [], // Simplified for now
        line,
        column,
        raw
      };
    } catch (error) {
      console.error('Error converting AST to JSX element:', error);
      return null;
    }
  }

  private getJSXAttributeValue(valueNode: any): string | boolean {
    if (!valueNode) return true;
    
    if (this.types.isStringLiteral(valueNode)) {
      return valueNode.value;
    }
    
    return 'expression';
  }

  private extractJSXElementsRegex(content: string): JSXElement[] {
    const elements: JSXElement[] = [];
    const jsxRegex = /<(\w+)([^>]*?)(?:\s*\/>|>(.*?)<\/\1>)/g;
    let match;

    while ((match = jsxRegex.exec(content)) !== null) {
      const [fullMatch, tagName, attributes] = match;
      const line = content.substring(0, match.index).split('\n').length;
      const props = this.parseAttributes(attributes);
      
      elements.push({
        type: tagName,
        props,
        children: [],
        line,
        column: 0,
        raw: fullMatch
      });
    }

    return elements;
  }

  private parseAttributes(attributeString: string): Record<string, string | number | boolean | null | undefined> {
    const props: Record<string, string | number | boolean | null | undefined> = {};
    const attrRegex = /(\w+)(?:=(?:{([^}]*)}|"([^"]*)"|'([^']*)'))?/g;
    let match;

    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, name, jsxValue, doubleQuoteValue, singleQuoteValue] = match;
      
      if (jsxValue !== undefined) {
        props[name] = `{${jsxValue}}`;
      } else if (doubleQuoteValue !== undefined) {
        props[name] = doubleQuoteValue;
      } else if (singleQuoteValue !== undefined) {
        props[name] = singleQuoteValue;
      } else {
        props[name] = true;
      }
    }

    return props;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import.*?from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    
    if (content.includes('export default')) {
      exports.push('default');
    }

    const namedExportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
    let match;

    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private convertJSXPropsToHTML(props: Record<string, string | number | boolean | null | undefined>): Record<string, string | number | boolean | null | undefined> {
    const htmlProps: Record<string, string | number | boolean | null | undefined> = {};
    
    for (const [key, value] of Object.entries(props)) {
      let htmlKey = key;
      
      // Enhanced JSX to HTML prop conversion
      if (key === 'className') {
        htmlKey = 'class';
      } else if (key === 'htmlFor') {
        htmlKey = 'for';
      } else if (key.startsWith('aria')) {
        htmlKey = key.toLowerCase();
      } else if (key === 'tabIndex') {
        htmlKey = 'tabindex';
      } else if (key === 'readOnly') {
        htmlKey = 'readonly';
      } else if (key === 'autoComplete') {
        htmlKey = 'autocomplete';
      } else if (key === 'autoFocus') {
        htmlKey = 'autofocus';
      } else if (key === 'contentEditable') {
        htmlKey = 'contenteditable';
      } else if (key === 'crossOrigin') {
        htmlKey = 'crossorigin';
      } else if (key === 'itemProp') {
        htmlKey = 'itemprop';
      } else if (key === 'itemRef') {
        htmlKey = 'itemref';
      } else if (key === 'itemType') {
        htmlKey = 'itemtype';
      } else if (key === 'noValidate') {
        htmlKey = 'novalidate';
      } else if (key === 'spellCheck') {
        htmlKey = 'spellcheck';
      }
      
      htmlProps[htmlKey] = value;
    }
    
    return htmlProps;
  }

  private isHTMLMatch(violationHtml: string, generatedHTML: string): boolean {
    // Normalize both HTML strings for comparison
    const normalize = (html: string) => html
      .replace(/\s+/g, ' ')
      .replace(/\s*=\s*/g, '=')
      .trim()
      .toLowerCase();
    
    const normalizedViolation = normalize(violationHtml);
    const normalizedGenerated = normalize(generatedHTML);
    
    // Try exact match first
    if (normalizedViolation === normalizedGenerated) {
      return true;
    }
    
    // Try partial matching for attributes
    const violationTag = this.extractTagInfo(normalizedViolation);
    const generatedTag = this.extractTagInfo(normalizedGenerated);
    
    if (violationTag.name === generatedTag.name) {
      // Check if key attributes match
      const keyAttributes = ['src', 'alt', 'href', 'id', 'class', 'type', 'name'];
      const matchingAttributes = keyAttributes.filter(attr => 
        violationTag.attributes[attr] === generatedTag.attributes[attr]
      );
      
      // Consider it a match if tag name matches and some key attributes match
      return matchingAttributes.length > 0;
    }
    
    return false;
  }

  private extractTagInfo(html: string): { name: string; attributes: Record<string, string> } {
    const tagMatch = html.match(/<(\w+)([^>]*)>/);
    if (!tagMatch) return { name: '', attributes: {} };
    
    const tagName = tagMatch[1];
    const attributeString = tagMatch[2];
    
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)(?:=["']([^"']*)["'])?/g;
    let match;
    
    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, attrName, attrValue] = match;
      attributes[attrName] = attrValue || '';
    }
    
    return { name: tagName, attributes };
  }

  private hasAccessibilityIssues(elements: JSXElement[]): boolean {
    // Enhanced accessibility issue detection
    for (const element of elements) {
      // Check for images without alt text
      if (element.type === 'img' && !element.props.alt) {
        return true;
      }
      
      // Check for inputs without labels or aria-label
      if (['input', 'select', 'textarea'].includes(element.type) && 
          !element.props['aria-label'] && 
          !element.props['aria-labelledby'] &&
          !element.props.id) { // id could be referenced by a label
        return true;
      }
      
      // Check for buttons without accessible text
      if (element.type === 'button' && 
          !element.props['aria-label'] && 
          !element.props['aria-labelledby'] &&
          element.children.length === 0) {
        return true;
      }

      // Check for links without accessible text
      if (element.type === 'a' && 
          !element.props['aria-label'] && 
          !element.props['aria-labelledby'] &&
          element.children.length === 0) {
        return true;
      }

      // Check for interactive elements without proper roles
      if (element.props.onClick && 
          !['button', 'a', 'input'].includes(element.type) &&
          !element.props.role) {
        return true;
      }
    }
    
    return false;
  }
} 