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