// Define types for scan results
export type ViolationType = {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  helpUrl: string;
  nodes: {
    html: string;
    target: string[];
    failureSummary: string;
  }[];
  tags: string[];
  aiSuggestion?: string;
};

export type ScanResult = {
  id: string;
  url: string;
  timestamp: string;
  status: 'completed' | 'failed';
  violations: ViolationType[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
};

// Type for a single URL scan request
export type SingleUrlScanRequest = {
  url: string;
  maxDepth?: number;
};

// Type for batch URL scan request
export type BatchUrlScanRequest = {
  urls: string[];
  maxDepth?: number;
};

// Union type for any scan request
export type ScanRequest = SingleUrlScanRequest | BatchUrlScanRequest;

// Check if a request is a batch scan
export function isBatchScanRequest(req: ScanRequest): req is BatchUrlScanRequest {
  return 'urls' in req && Array.isArray(req.urls);
}

// GitHub Integration Types
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
}

export interface CodeFix {
  filePath: string;
  originalContent: string;
  fixedContent: string;
  description: string;
  violationsFixed: string[];
}

export interface PullRequestResult {
  success: boolean;
  pullRequest?: {
    url: string;
    number: number;
  };
  fixesApplied?: number;
  error?: string;
}

// React/JSX specific types
export interface ReactFile {
  path: string;
  type: 'component' | 'page' | 'layout' | 'other';
  framework: 'react' | 'nextjs';
  priority: number;
  language: 'tsx' | 'jsx' | 'ts' | 'js';
  content?: string;
}

export interface JSXElement {
  type: string;
  props: Record<string, string | number | boolean | null | undefined>;
  children: JSXElement[];
  line: number;
  column: number;
  raw: string; // Original JSX string
}

export interface ParsedJSXFile {
  filePath: string;
  elements: JSXElement[];
  imports: string[];
  exports: string[];
  hasAccessibilityIssues: boolean;
}

export interface JSXCodeFix extends CodeFix {
  elementType: string;
  propsModified: string[];
  jsxTransform: boolean;
  reactSpecific: boolean;
}

export interface MatchResult {
  violation: ViolationType;
  jsxElement: JSXElement;
  filePath: string;
  confidence: number; // 0-1, how confident we are about the match
  matchType: 'exact' | 'fuzzy' | 'semantic';
}

export interface ComponentTree {
  filePath: string;
  componentName: string;
  children: ComponentTree[];
  usedComponents: string[];
  accessibilityRelevant: boolean;
}

export interface ElementMatch {
  originalHtml: string;
  jsxElement: JSXElement;
  filePath: string;
  transformations: string[];
}

export interface ReactFileStructure {
  components: string[];
  pages: string[];
  layouts: string[];
  otherRelevant: string[];
  allFiles: string[];
}

// Enhanced GitHub repository interface for React support
export interface EnhancedGitHubRepository extends GitHubRepository {
  reactFileStructure?: ReactFileStructure;
  hasReactFiles: boolean;
  hasNextJsFiles: boolean;
  framework: 'html' | 'react' | 'nextjs' | 'mixed';
} 