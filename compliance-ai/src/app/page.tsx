'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'react-toastify';
import { ScanResult } from '../types';

// Dynamically import components to avoid SSR issues with browser-only libraries
const UrlForm = dynamic(() => import('../components/UrlForm'), { ssr: false });
const ScanHistory = dynamic(() => import('../components/ScanHistory'), { ssr: false });

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const handleScanComplete = (result: ScanResult | ScanResult[]) => {
    if (Array.isArray(result)) {
      setScanHistory(prev => [...result, ...prev]);
    } else {
      setScanHistory(prev => [result, ...prev]);
    }
    setIsLoading(false);
    toast.success('Scan completed successfully!');
  };

  const handleScanError = (error: Error) => {
    setIsLoading(false);
    toast.error(`Scan failed: ${error.message || 'Unknown error'}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">WCAG Compliance Scanner</h1>
          <p className="mt-2 text-sm text-gray-600">
            Check your website for WCAG 2.0 (AA) compliance and get AI-powered suggestions to fix issues
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Submit URL for Analysis</h2>
            <UrlForm 
              onScanStart={() => setIsLoading(true)}
              onScanComplete={handleScanComplete}
              onScanError={handleScanError}
              isLoading={isLoading}
            />
          </div>

          {scanHistory.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow px-5 py-6 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Scan History</h2>
              <ScanHistory history={scanHistory} />
            </div>
          )}
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
