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