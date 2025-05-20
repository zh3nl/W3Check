import React from 'react';
import { ScanResult } from '../../types';

interface ResultsHeaderProps {
  result: ScanResult;
  isMultiPage: boolean;
  domain: string;
  scanUrl: string;
  relatedResultsCount?: number;
}

export default function ResultsHeader({ 
  result, 
  isMultiPage, 
  domain, 
  scanUrl,
  relatedResultsCount 
}: ResultsHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900">
        {isMultiPage 
          ? `Website Scan Results for ${domain || "Unknown domain"}`
          : `Scan Results for ${scanUrl || "Unknown URL"}`
        }
      </h2>
      <p className="text-sm text-gray-500">
        Scanned on {new Date(result.timestamp).toLocaleString()}
        {isMultiPage && relatedResultsCount && ` • ${relatedResultsCount} pages scanned`}
      </p>
    </div>
  );
} 