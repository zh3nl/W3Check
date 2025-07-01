export interface FileClassification {
  path: string;
  type: 'component' | 'page' | 'layout' | 'api' | 'config' | 'test' | 'other';
  framework: 'react' | 'nextjs' | 'html' | 'unknown';
  priority: number; // 1-10, higher is more important for accessibility
  isAccessibilityRelevant: boolean;
  language: 'tsx' | 'jsx' | 'ts' | 'js' | 'html' | 'css' | 'other';
}

export class FileClassifier {
  // Patterns for different file types
  private static readonly REACT_FILE_EXTENSIONS = ['.tsx', '.jsx', '.js', '.ts'];
  private static readonly HTML_FILE_EXTENSIONS = ['.html', '.htm'];
  private static readonly STYLE_FILE_EXTENSIONS = ['.css', '.scss', '.sass', '.less'];
  
  // Directories to exclude from accessibility scanning
  private static readonly EXCLUDE_PATTERNS = [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    'out/**',
    '__tests__/**',
    '**/*.test.*',
    '**/*.spec.*',
    '.git/**',
    'coverage/**',
    '.nyc_output/**',
    'temp/**',
    'tmp/**',
    '.cache/**',
    '.turbo/**',
    'public/fonts/**',
    'public/icons/**',
    'public/favicon*'
  ];
  
  // High priority directories for accessibility
  private static readonly PRIORITY_PATTERNS = [
    'src/components/**',
    'src/pages/**',
    'src/app/**',
    'components/**',
    'pages/**',
    'app/**',
    'src/layouts/**',
    'layouts/**'
  ];
  
  // API and config patterns (low priority for accessibility)
  private static readonly API_PATTERNS = [
    '**/api/**',
    '**/*.config.*',
    '**/*.setup.*',
    '**/middleware.*'
  ];

  static classifyFile(filePath: string): FileClassification {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const fileName = normalizedPath.split('/').pop() || '';
    const fileExtension = this.getFileExtension(fileName);
    
    return {
      path: normalizedPath,
      type: this.getFileType(normalizedPath, fileName),
      framework: this.detectFramework(normalizedPath, fileName),
      priority: this.calculatePriority(normalizedPath, fileName),
      isAccessibilityRelevant: this.isAccessibilityRelevant(normalizedPath, fileName),
      language: this.getLanguage(fileExtension)
    };
  }

  static isReactComponent(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    const fileName = normalized.split('/').pop() || '';
    
    // Check if it's a React file extension
    if (!this.REACT_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      return false;
    }
    
    // Check if it's in a components directory or follows component naming
    return (
      normalized.includes('/components/') ||
      /^[A-Z]/.test(fileName) || // PascalCase naming
      fileName.endsWith('.component.tsx') ||
      fileName.endsWith('.component.jsx')
    );
  }

  static isNextJsPage(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    
    // Next.js App Router patterns
    if (normalized.includes('/app/') && (
      normalized.endsWith('/page.tsx') ||
      normalized.endsWith('/page.jsx') ||
      normalized.endsWith('/page.js') ||
      normalized.endsWith('/page.ts')
    )) {
      return true;
    }
    
    // Next.js Pages Router patterns
    if (normalized.includes('/pages/') && 
        this.REACT_FILE_EXTENSIONS.some(ext => normalized.endsWith(ext)) &&
        !normalized.includes('/api/')) {
      return true;
    }
    
    return false;
  }

  static isLayout(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    const fileName = normalized.split('/').pop() || '';
    
    return (
      fileName === 'layout.tsx' ||
      fileName === 'layout.jsx' ||
      fileName === 'layout.js' ||
      fileName === 'layout.ts' ||
      normalized.includes('/layouts/') ||
      fileName.toLowerCase().includes('layout')
    );
  }

  static shouldIncludeForAccessibility(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    
    // Check exclude patterns first
    for (const pattern of this.EXCLUDE_PATTERNS) {
      if (this.matchesPattern(normalized, pattern)) {
        return false;
      }
    }
    
    // Check if it's an accessibility-relevant file type
    const classification = this.classifyFile(filePath);
    return classification.isAccessibilityRelevant;
  }

  static getFilePriority(filePath: string): number {
    const classification = this.classifyFile(filePath);
    return classification.priority;
  }

  static filterRelevantFiles(filePaths: string[]): string[] {
    return filePaths
      .filter(path => this.shouldIncludeForAccessibility(path))
      .sort((a, b) => this.getFilePriority(b) - this.getFilePriority(a)); // Sort by priority descending
  }

  private static getFileType(filePath: string, fileName: string): FileClassification['type'] {
    if (this.isNextJsPage(filePath)) return 'page';
    if (this.isLayout(filePath)) return 'layout';
    if (this.isReactComponent(filePath)) return 'component';
    
    // Check for API routes
    for (const pattern of this.API_PATTERNS) {
      if (this.matchesPattern(filePath, pattern)) {
        return 'api';
      }
    }
    
    // Check for config files
    if (fileName.includes('.config.') || fileName.includes('.setup.')) {
      return 'config';
    }
    
    // Check for test files
    if (fileName.includes('.test.') || fileName.includes('.spec.') || filePath.includes('__tests__')) {
      return 'test';
    }
    
    return 'other';
  }

  private static detectFramework(filePath: string, fileName: string): FileClassification['framework'] {
    // Check for Next.js specific patterns
    if (
      filePath.includes('/app/') ||
      filePath.includes('/pages/') ||
      fileName === 'next.config.js' ||
      fileName === 'next.config.ts'
    ) {
      return 'nextjs';
    }
    
    // Check for React files
    if (this.REACT_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      return 'react';
    }
    
    // Check for HTML files
    if (this.HTML_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      return 'html';
    }
    
    return 'unknown';
  }

  private static calculatePriority(filePath: string, fileName: string): number {
    let priority = 1; // Base priority
    
    // High priority for pages and components
    if (this.isNextJsPage(filePath)) priority += 8; // 9 total
    if (this.isLayout(filePath)) priority += 7; // 8 total  
    if (this.isReactComponent(filePath)) priority += 6; // 7 total
    
    // Medium priority for other React files
    if (this.REACT_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      priority += 3; // 4 total
    }
    
    // Higher priority for files in important directories
    for (const pattern of this.PRIORITY_PATTERNS) {
      if (this.matchesPattern(filePath, pattern)) {
        priority += 2;
        break;
      }
    }
    
    // Lower priority for API and config files
    for (const pattern of this.API_PATTERNS) {
      if (this.matchesPattern(filePath, pattern)) {
        priority = Math.max(1, priority - 3);
        break;
      }
    }
    
    // Cap at 10
    return Math.min(10, priority);
  }

  private static isAccessibilityRelevant(filePath: string, fileName: string): boolean {
    const fileType = this.getFileType(filePath, fileName);
    const framework = this.detectFramework(filePath, fileName);
    
    // Pages, layouts, and components are always relevant
    if (['page', 'layout', 'component'].includes(fileType)) {
      return true;
    }
    
    // HTML files are relevant
    if (framework === 'html') {
      return true;
    }
    
    // React/Next.js files in relevant directories
    if ((framework === 'react' || framework === 'nextjs') && 
        this.PRIORITY_PATTERNS.some(pattern => this.matchesPattern(filePath, pattern))) {
      return true;
    }
    
    // Style files that might contain accessibility-related CSS
    if (this.STYLE_FILE_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      return true;
    }
    
    return false;
  }

  private static getLanguage(extension: string): FileClassification['language'] {
    switch (extension) {
      case '.tsx': return 'tsx';
      case '.jsx': return 'jsx';
      case '.ts': return 'ts';
      case '.js': return 'js';
      case '.html':
      case '.htm': return 'html';
      case '.css':
      case '.scss':
      case '.sass':
      case '.less': return 'css';
      default: return 'other';
    }
  }

  private static getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot === -1 ? '' : fileName.substring(lastDot);
  }

  private static matchesPattern(filePath: string, pattern: string): boolean {
    // Simple glob pattern matching
    const regexPattern = pattern
      .replace(/\*\*/g, '.*') // ** matches any path
      .replace(/\*/g, '[^/]*') // * matches any filename chars except /
      .replace(/\./g, '\\.'); // Escape dots
    
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filePath);
  }
} 