'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ScanResult, IncompleteItem } from '../../types';
import LoadingSpinner from '../../components/results-page/LoadingSpinner';
import NoResultsFound from '../../components/results-page/NoResultsFound';
import ResultsHeader from '../../components/results-page/ResultsHeader';
import CrawlSummary from '../../components/results-page/CrawlSummary';
import ReviewSummary from '../../components/results-page/ReviewSummary';
import ExportReviews from '../../components/results-page/ExportReviews';

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

// Helper function to get domain from URL
function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url; // Return original if parsing fails
  }
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");

  const [result, setResult] = useState<ScanResult | null>(null);
  const [relatedResults, setRelatedResults] = useState<ScanResult[]>([]);
  const [isMultiPage, setIsMultiPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<string>("");
  const [scanUrl, setScanUrl] = useState<string>("");

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
            
            // Set domain and URL
            if (primary?.url) {
              setScanUrl(primary.url);
              setDomain(getDomainFromUrl(primary.url));
            } else if (related[0]?.url) {
              setScanUrl(related[0].url);
              setDomain(getDomainFromUrl(related[0].url));
            }
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
            
            // Set domain and URL
            if (foundResult.url) {
              setScanUrl(foundResult.url);
              setDomain(getDomainFromUrl(foundResult.url));
            }
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
          
          // Set domain and URL
          if (history[0].url) {
            setScanUrl(history[0].url);
            setDomain(getDomainFromUrl(history[0].url));
          }
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

  const handleReviewUpdate = (scanId: string, updatedItems: IncompleteItem[]) => {
    // Update the result with new review data
    if (result && result.id === scanId) {
      const updatedResult = {
        ...result,
        incompleteItems: updatedItems
      };
      setResult(updatedResult);
      
      // Update localStorage
      try {
        const storedHistory = localStorage.getItem("scanHistory");
        if (storedHistory) {
          const history: ScanResult[] = JSON.parse(storedHistory);
          const updatedHistory = history.map(item => 
            item.id === scanId ? updatedResult : item
          );
          localStorage.setItem("scanHistory", JSON.stringify(updatedHistory));
        }
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!result) {
    return <NoResultsFound />;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 mb-6 overflow-x-auto break-words max-w-full">
        <ResultsHeader 
          result={result}
          isMultiPage={isMultiPage}
          domain={domain}
          scanUrl={scanUrl}
          relatedResultsCount={relatedResults.length}
        />
        
        {isMultiPage && <CrawlSummary results={relatedResults} />}
        
        {/* Manual Review Summary */}
        {result.incompleteItems && result.incompleteItems.length > 0 && (
          <ReviewSummary incompleteItems={result.incompleteItems} />
        )}
        
        {/* Export Reviews */}
        {result.incompleteItems && result.incompleteItems.length > 0 && (
          <ExportReviews 
            incompleteItems={result.incompleteItems}
            url={result.url}
            timestamp={result.timestamp}
          />
        )}
        
        <h3 className="text-lg text-black font-medium mb-4">
          {isMultiPage ? 'Page Details' : 'Scan Details'}
        </h3>
        <ScanHistory 
          history={isMultiPage ? relatedResults : [result]}
          onReviewUpdate={handleReviewUpdate}
        />
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to right, #f7f9fd 0%, #f7f9fd 100%)' }}>
      <main className="p-8 overflow-y-auto">
        <Suspense fallback={<LoadingSpinner color="blue" />}>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  );
}