'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ScanResult } from '../../types';

// Dynamically import components to avoid SSR issues with browser-only libraries
const ScanHistory = dynamic(() => import('../../components/scan-functions/ScanHistory'), { ssr: false });

// Helper function to determine if this is a multi-page crawl result
function isMultiPageCrawl(resultId: string, history: ScanResult[]): boolean {
  if (!resultId) return false;
  
  // Check if there are multiple results with IDs that start with the same prefix
  const relatedResults = history.filter(item => {
    if (!item.id || typeof item.id !== 'string') return false;
    return item.id === resultId || 
      (resultId.includes('-') && item.id.startsWith(resultId.split('-')[0]));
  });
  
  return relatedResults.length > 1;
}

// Helper to get all related results for a crawl
function getRelatedResults(resultId: string, history: ScanResult[]): ScanResult[] {
  if (!resultId) return [];
  
  if (!resultId.includes('-')) {
    // For the main result without a dash, find all related by the prefix
    return history.filter(item => {
      if (!item.id || typeof item.id !== 'string') return false;
      return item.id === resultId || item.id.startsWith(`${resultId}-`);
    });
  } else {
    // For results with a dash, find by the prefix before the dash
    const prefix = resultId.split('-')[0];
    return history.filter(item => {
      if (!item.id || typeof item.id !== 'string') return false;
      return item.id === prefix || item.id.startsWith(`${prefix}-`);
    });
  }
}

// Create a component to display crawl statistics
function CrawlSummary({ results }: { results: ScanResult[] }) {
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

// Create a separate component that uses useSearchParams
function ResultsContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const router = useRouter();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [relatedResults, setRelatedResults] = useState<ScanResult[]>([]);
  const [isMultiPage, setIsMultiPage] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch results from localStorage
    try {
      const storedHistory = localStorage.getItem("scanHistory");
      if (!storedHistory) {
        console.log("No scan history found in localStorage");
        setLoading(false);
        return;
      }
      
      let history: ScanResult[] = [];
      try {
        history = JSON.parse(storedHistory);
        if (!Array.isArray(history)) {
          console.error("Scan history is not an array:", history);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Error parsing scan history:", e);
        setLoading(false);
        return;
      }
      
      if (history.length === 0) {
        console.log("Scan history is empty");
        setLoading(false);
        return;
      }
      
      if (resultId) {
        // Check if this is a multi-page crawl
        const multiPage = isMultiPageCrawl(resultId, history);
        setIsMultiPage(multiPage);
        
        if (multiPage) {
          // Get all related results for the crawl
          const related = getRelatedResults(resultId, history);
          if (related.length > 0) {
            setRelatedResults(related);
            
            // Set the primary result (the one with the matching ID)
            const primary = history.find((item) => item.id === resultId);
            setResult(primary || related[0]);
          } else {
            console.log("No related results found for multi-page crawl");
            setResult(null);
          }
        } else {
          // Regular single-page result
          const foundResult = history.find((item) => item.id === resultId);
          if (foundResult) {
            setResult(foundResult);
            setRelatedResults([foundResult]);
          } else {
            console.log(`Result with ID ${resultId} not found`);
            setResult(null);
          }
        }
      } else {
        // If no ID is provided, use the most recent result
        if (history.length > 0) {
          setResult(history[0]);
          setRelatedResults([history[0]]);
        }
      }
    } catch (error) {
      console.error("Error in results page:", error);
      setResult(null);
      setRelatedResults([]);
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : result ? (
        <div>
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isMultiPage 
                  ? `Website Scan Results for ${new URL(result.url).hostname}`
                  : `Scan Results for ${result.url}`
                }
              </h2>
              <p className="text-sm text-gray-500">
                Scanned on {new Date(result.timestamp).toLocaleString()}
                {isMultiPage && ` • ${relatedResults.length} pages scanned`}
              </p>
            </div>
            
            {isMultiPage && <CrawlSummary results={relatedResults} />}
            
            <h3 className="text-lg font-medium mb-4">
              {isMultiPage ? 'Page Details' : 'Scan Details'}
            </h3>
            <ScanHistory history={isMultiPage ? relatedResults : [result]} />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Results Found
          </h3>
          <p className="text-gray-500 mb-4">
            We couldn&apos;t find any scan results. Please go back and run
            a new scan.
          </p>
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Start a New Scan
          </button>
        </div>
      )}
    </>
  );
}

// Main component that doesn't directly use useSearchParams
export default function ResultsPage() {
  const router = useRouter();
  
  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-800 to-indigo-900 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                WCAG Compliance Scanner
              </h1>
              <p className="mt-2 text-sm text-indigo-200">
                AI-powered WCAG 2.1 AA compliance analysis results
              </p>
            </div>
            <button
              onClick={handleBackToHome}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back to Scanner
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Suspense fallback={
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          }>
            <ResultsContent />
          </Suspense>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} W3Check
          </p>
        </div>
      </footer>
    </div>
  );
}