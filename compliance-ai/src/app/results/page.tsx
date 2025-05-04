'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ScanResult } from '../../types';

// Dynamically import components to avoid SSR issues with browser-only libraries
<<<<<<< HEAD
const ScanHistory = dynamic(() => import("../../components/ScanHistory"), {
  ssr: false,
});
=======
const ScanHistory = dynamic(() => import('../../components/scan-functions/ScanHistory'), { ssr: false });
>>>>>>> feature/my-new-branch

// Create a separate component that uses useSearchParams
function ResultsContent() {
  const searchParams = useSearchParams();
  const resultId = searchParams.get("id");
  const router = useRouter();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch results from localStorage
    const storedHistory = localStorage.getItem("scanHistory");
    if (storedHistory) {
      const history = JSON.parse(storedHistory);

      if (resultId) {
        // Find the specific result by ID
        const foundResult = history.find((item: { id: string; }) => item.id === resultId);
        if (foundResult) {
          setResult(foundResult);
        }
      } else {
        // If no ID is provided, use the most recent result
        if (history.length > 0) {
          setResult(history[0]);
        }
      }
    }

    setLoading(false);
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
        <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Scan Results for {result.url}
            </h2>
            <p className="text-sm text-gray-500">
              Scanned on {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
          <ScanHistory history={[result]} />
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
              <p className="mt-2 text-sm text-purple-200">
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
            © {new Date().getFullYear()} Novita AI WCAG Compliance Scanner
          </p>
        </div>
      </footer>
    </div>
  );
}