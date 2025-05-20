import React from 'react';
import { ScanResult } from '../../types';

interface CrawlSummaryProps {
  results: ScanResult[];
}

export default function CrawlSummary({ results }: CrawlSummaryProps) {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">No scan results available to display.</div>;
  }

  const totalViolations = results.reduce((sum, result) => {
    if (!result.violations || !Array.isArray(result.violations)) return sum;
    return sum + result.violations.length;
  }, 0);
  
  const totalCritical = results.reduce((sum, result) => {
    if (!result.summary || typeof result.summary !== 'object' || result.summary.critical === undefined) return sum;
    return sum + (result.summary.critical || 0);
  }, 0);
  
  const totalSerious = results.reduce((sum, result) => {
    if (!result.summary || typeof result.summary !== 'object' || result.summary.serious === undefined) return sum;
    return sum + (result.summary.serious || 0);
  }, 0);
  
  const totalModerate = results.reduce((sum, result) => {
    if (!result.summary || typeof result.summary !== 'object' || result.summary.moderate === undefined) return sum;
    return sum + (result.summary.moderate || 0);
  }, 0);
  
  const totalMinor = results.reduce((sum, result) => {
    if (!result.summary || typeof result.summary !== 'object' || result.summary.minor === undefined) return sum;
    return sum + (result.summary.minor || 0);
  }, 0);
  
  const completedScans = results.filter(result => result.status === 'completed').length;
  const failedScans = results.filter(result => result.status === 'failed').length;
  
  // Group violations by type across all pages
  const violationsByType = results.reduce((acc, result) => {
    if (!result || !result.violations || !Array.isArray(result.violations)) {
      return acc;
    }
    
    result.violations.forEach(violation => {
      if (!violation || !violation.id) return;
      
      if (!acc[violation.id]) {
        acc[violation.id] = {
          id: violation.id,
          description: violation.description || 'No description available',
          impact: violation.impact || 'unknown',
          count: 0,
          urls: new Set()
        };
      }
      acc[violation.id].count++;
      if (result.url) {
        acc[violation.id].urls.add(result.url);
      }
    });
    return acc;
  }, {} as Record<string, { id: string, description: string, impact: string, count: number, urls: Set<string> }>);
  
  const sortedViolationTypes = Object.values(violationsByType).sort((a, b) => {
    // Sort by impact severity first
    const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    if (impactOrder[a.impact as keyof typeof impactOrder] !== impactOrder[b.impact as keyof typeof impactOrder]) {
      return impactOrder[a.impact as keyof typeof impactOrder] - impactOrder[b.impact as keyof typeof impactOrder];
    }
    // Then by count (most frequent first)
    return b.count - a.count;
  });

  return (
    <div className="mb-8 bg-white rounded-lg shadow px-5 py-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Crawl Summary
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Pages Scanned</h3>
          <div className="flex space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg flex-1 text-center">
              <div className="text-2xl font-bold text-blue-700">{results.length}</div>
              <div className="text-sm text-blue-600">Total Pages</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg flex-1 text-center">
              <div className="text-2xl font-bold text-green-700">{completedScans}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            {failedScans > 0 && (
              <div className="bg-red-50 p-3 rounded-lg flex-1 text-center">
                <div className="text-2xl font-bold text-red-700">{failedScans}</div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Issues Found</h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-gray-50 p-2 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-700">{totalViolations}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="bg-red-50 p-2 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-700">{totalCritical}</div>
              <div className="text-xs text-red-600">Critical</div>
            </div>
            <div className="bg-orange-50 p-2 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-700">{totalSerious}</div>
              <div className="text-xs text-orange-600">Serious</div>
            </div>
            <div className="bg-yellow-50 p-2 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-700">{totalModerate}</div>
              <div className="text-xs text-yellow-600">Moderate</div>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-700">{totalMinor}</div>
              <div className="text-xs text-blue-600">Minor</div>
            </div>
          </div>
        </div>
      </div>
      
      {sortedViolationTypes.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Common Issues</h3>
          <div className="bg-white rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occurrences
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pages
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedViolationTypes.slice(0, 5).map((violation) => (
                    <tr key={violation.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {violation.id}
                        <div className="text-xs text-gray-500">{violation.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${violation.impact === 'critical' ? 'bg-red-100 text-red-800' : 
                          violation.impact === 'serious' ? 'bg-orange-100 text-orange-800' :
                          violation.impact === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'}`}>
                          {violation.impact}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {violation.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {violation.urls.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 