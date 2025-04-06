'use client';

import { useState } from 'react';
import { ScanResult, ViolationType } from '../types';

type ScanHistoryProps = {
  history: ScanResult[];
};

export default function ScanHistory({ history }: ScanHistoryProps) {
  const [expandedScan, setExpandedScan] = useState<string | null>(null);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);

  // Toggle scan details
  const toggleScanDetails = (id: string) => {
    setExpandedScan(expandedScan === id ? null : id);
    setExpandedViolation(null);
  };

  // Toggle violation details
  const toggleViolationDetails = (id: string) => {
    setExpandedViolation(expandedViolation === id ? null : id);
  };

  // Function to get appropriate color for impact level
  const getImpactColor = (impact: ViolationType['impact']) => {
    switch (impact) {
      case 'critical':
        return 'text-red-700 bg-red-100';
      case 'serious':
        return 'text-orange-700 bg-orange-100';
      case 'moderate':
        return 'text-yellow-700 bg-yellow-100';
      case 'minor':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <p className="text-gray-500 italic">No scan history yet</p>
      ) : (
        history.map((scan) => (
          <div key={scan.id} className="border rounded-md overflow-hidden">
            <div 
              className="bg-gray-50 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100"
              onClick={() => toggleScanDetails(scan.id)}
            >
              <div>
                <h3 className="font-medium text-black">{scan.url}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(scan.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      scan.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {scan.status === 'completed' ? 'Completed' : 'Failed'}
                    </span>
                    {scan.status === 'completed' && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        scan.summary.total === 0 
                          ? 'bg-green-100 text-green-800' 
                          : scan.summary.critical > 0 || scan.summary.serious > 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {scan.summary.total} {scan.summary.total === 1 ? 'issue' : 'issues'}
                      </span>
                    )}
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
                  <div className="space-y-4">
                    <h4 className="font-medium">Violations ({scan.violations.length})</h4>
                    <div className="space-y-3">
                      {scan.violations.map((violation) => (
                        <div key={violation.id} className="border rounded-md overflow-hidden">
                          <div 
                            className={`px-4 py-3 flex justify-between items-center cursor-pointer ${getImpactColor(violation.impact)}`}
                            onClick={() => toggleViolationDetails(violation.id)}
                          >
                            <div>
                              <h5 className="font-medium">{violation.id}</h5>
                              <p className="text-sm">{violation.description}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="uppercase text-xs font-bold">{violation.impact}</span>
                              <svg 
                                className={`h-5 w-5 transform transition-transform ${expandedViolation === violation.id ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {expandedViolation === violation.id && (
                            <div className="px-4 py-3 border-t bg-white">
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-gray-500 mb-1">AI Suggestion</h6>
                                <p className="text-sm">{violation.aiSuggestion || 'No AI suggestion available'}</p>
                              </div>
                              
                              <div className="mb-4">
                                <h6 className="text-sm font-medium text-gray-500 mb-1">Affected Elements ({violation.nodes.length})</h6>
                                <div className="space-y-2">
                                  {violation.nodes.map((node, index) => (
                                    <div key={index} className="text-sm">
                                      <div className="bg-gray-50 p-2 rounded font-mono whitespace-pre-wrap text-xs overflow-x-auto">
                                        {node.html}
                                      </div>
                                      {node.failureSummary && (
                                        <div className="mt-1 text-red-600 text-xs">
                                          {node.failureSummary}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h6 className="text-sm font-medium text-gray-500 mb-1">More Information</h6>
                                <a 
                                  href={violation.helpUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  View documentation
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
} 