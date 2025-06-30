'use client';

import { useState } from 'react';
import { ScanResult, IncompleteItem } from '../../types';
import AISuggestion from './AISuggestion';
import ManualReview from '../results-page/ManualReview';

interface ScanHistoryProps {
  history: ScanResult[];
  onReviewUpdate?: (scanId: string, updatedItems: IncompleteItem[]) => void;
}

export default function ScanHistory({ history, onReviewUpdate }: ScanHistoryProps) {
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);
  const [localHistory, setLocalHistory] = useState<ScanResult[]>(history);

  const handleReviewUpdate = (scanId: string, updatedItems: IncompleteItem[]) => {
    setLocalHistory(prev => prev.map(scan => {
      if (scan.id === scanId) {
        return {
          ...scan,
          incompleteItems: updatedItems
        };
      }
      return scan;
    }));
    
    // Call parent's onReviewUpdate if provided
    if (onReviewUpdate) {
      onReviewUpdate(scanId, updatedItems);
    }
  };

  if (!localHistory || localHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No scan results found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {localHistory.map((scan) => (
        <div key={scan.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedScan(expandedScan === scan.id ? null : scan.id)}>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-sm font-medium text-gray-900">{scan.url}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    scan.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {scan.status === 'completed' ? 'Completed' : 'Failed'}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(scan.timestamp).toLocaleString()}
                </div>
              </div>
              
              <svg 
                className={`h-5 w-5 text-gray-500 transform transition-transform ${expandedScan === scan.id ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {expandedScan === scan.id && scan.status === 'completed' && (
            <div className="px-4 py-3 border-t">
              <div className="flex justify-between mb-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Summary</div>
                  <div className="flex space-x-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {scan.summary.critical} Critical
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {scan.summary.serious} Serious
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {scan.summary.moderate} Moderate
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {scan.summary.minor} Minor
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Test Results</div>
                  <div className="flex space-x-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {scan.passes} Passed
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {scan.incomplete} Needs Review
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {scan.inapplicable} Not Applicable
                    </span>
                  </div>
                </div>
              </div>
              
              {scan.violations.length === 0 ? (
                <div className="bg-green-50 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">No accessibility issues found</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>This page passed all automated accessibility checks.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Accessibility Violations</h4>
                  {scan.violations.map((violation, index) => (
                    <div key={`${scan.id}-${index}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-sm font-medium text-gray-900">{violation.id}</h5>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              violation.impact === 'critical' ? 'bg-red-100 text-red-800' :
                              violation.impact === 'serious' ? 'bg-orange-100 text-orange-800' :
                              violation.impact === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {violation.impact}
                            </span>
                          </div>
                          <button
                            onClick={() => setExpandedViolation(expandedViolation === `${scan.id}-${index}` ? null : `${scan.id}-${index}`)}
                            className="text-xs text-gray-500 hover:text-gray-700"
                          >
                            {expandedViolation === `${scan.id}-${index}` ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                      </div>
                      
                      {expandedViolation === `${scan.id}-${index}` && (
                        <div className="px-4 py-3 border-t">
                          <AISuggestion suggestion={violation.aiSuggestion || 'No AI suggestion available.'} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Review Section */}
              {scan.incompleteItems && scan.incompleteItems.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <ManualReview 
                    incompleteItems={scan.incompleteItems}
                    onReviewUpdate={(updatedItems) => handleReviewUpdate(scan.id, updatedItems)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 