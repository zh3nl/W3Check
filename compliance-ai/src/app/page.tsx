'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ScanResult } from '../types';

// Dynamically import components to avoid SSR issues with browser-only libraries
const UrlForm = dynamic(() => import('../components/UrlForm'), { ssr: false });

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // Initialize history from localStorage if available
  useEffect(() => {
    // This will only run client-side
    const storedHistory = localStorage.getItem('scanHistory');
    if (storedHistory) {
      try {
        // Make sure the stored data is valid JSON
        JSON.parse(storedHistory);
      } catch {
        // Reset if invalid
        localStorage.setItem('scanHistory', JSON.stringify([]));
      }
    } else {
      // Initialize empty history if none exists
      localStorage.setItem('scanHistory', JSON.stringify([]));
    }
  }, []);

  const handleScanComplete = (result: ScanResult | ScanResult[]) => {
    // Store the result in localStorage
    const storedHistory = localStorage.getItem('scanHistory') || '[]';
    let history: ScanResult[] = JSON.parse(storedHistory);
    
    if (Array.isArray(result)) {
      history = [...result, ...history];
      localStorage.setItem('scanHistory', JSON.stringify(history));
      
      // Redirect to the results page with the first result
      if (result.length > 0) {
        router.push(`/results?id=${result[0].id}`);
      }
    } else {
      history = [result, ...history];
      localStorage.setItem('scanHistory', JSON.stringify(history));
      
      // Redirect to the results page with the result
      router.push(`/results?id=${result.id}`);
    }
    
    setIsLoading(false);
    toast.success('Scan completed successfully!');
  };

  const handleScanError = (error: Error) => {
    setIsLoading(false);
    toast.error(`Scan failed: ${error.message || 'Unknown error'}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="py-12 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-bold text-purple-300 mb-4">Compliance AI</h1>
        <p className="text-xl max-w-3xl mx-auto">
          Ensure your website meets accessibility standards with our AI-powered WCAG 2.1 AA compliance scanner.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 mb-12">
          <div className="flex space-x-4 mb-6">
            <button className="bg-purple-600 text-white px-4 py-2 rounded-full font-medium">
              Single URL
            </button>
            <button className="bg-transparent text-gray-300 px-4 py-2 rounded-full font-medium hover:bg-gray-700">
              Batch URLs
            </button>
          </div>
          
          <UrlForm 
            onScanStart={() => setIsLoading(true)}
            onScanComplete={handleScanComplete}
            onScanError={handleScanError}
            isLoading={isLoading}
          />
          
          <p className="mt-4 text-sm text-gray-400">
            Our scanner checks for WCAG 2.1 AA compliance issues and provides AI-powered suggestions to improve accessibility.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-10">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="bg-blue-800 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">URL Processing</h3>
              <p className="text-gray-400">
                Submit any website URL through our intuitive interface or API for comprehensive accessibility testing.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="bg-purple-800 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">JavaScript Rendering</h3>
              <p className="text-gray-400">
                Our Puppeteer-powered crawler renders JavaScript to analyze dynamic content just like real users experience it.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="bg-green-800 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">WCAG 2.1 AA Checks</h3>
              <p className="text-gray-400">
                Automated testing against WCAG 2.1 AA standards using the industry-leading axe-core accessibility engine.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="bg-red-800 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Fixes</h3>
              <p className="text-gray-400">
                Get intelligent, contextual suggestions to fix accessibility issues using our advanced AI enhancement layer.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <div className="bg-purple-900/30 p-3 rounded-full inline-block mb-4">
                  <span className="bg-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold">1</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Submit Your URL</h3>
                <p className="text-gray-400">
                  Enter any website URL through our web interface or API. We validate and process your request instantly.
                </p>
              </div>
              <div className="md:w-1/2 bg-gray-800 p-4 rounded-lg">
                <div className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="text-sm text-gray-400 mb-2">URL Input Illustration</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 bg-gray-800 p-4 rounded-lg order-1 md:order-0">
                <div className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="text-sm text-gray-400 mb-2">Crawling Illustration</div>
                </div>
              </div>
              <div className="md:w-1/2 mb-6 md:mb-0 md:pl-8 order-0 md:order-1">
                <div className="bg-purple-900/30 p-3 rounded-full inline-block mb-4">
                  <span className="bg-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold">2</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Crawl & Analyze</h3>
                <p className="text-gray-400">
                  Our system crawls your website using Puppeteer, rendering JavaScript and extracting the DOM for comprehensive analysis.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-6 md:mb-0 md:pr-8">
                <div className="bg-purple-900/30 p-3 rounded-full inline-block mb-4">
                  <span className="bg-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold">3</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Run WCAG Tests</h3>
                <p className="text-gray-400">
                  We run axe-core automated tests to identify WCAG 2.1 AA violations and accessibility issues in your website.
                </p>
              </div>
              <div className="md:w-1/2 bg-gray-800 p-4 rounded-lg">
                <div className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="text-sm text-gray-400 mb-2">Testing Illustration</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 bg-gray-800 p-4 rounded-lg order-1 md:order-0">
                <div className="bg-gray-700 p-4 rounded border border-gray-600">
                  <div className="text-sm text-gray-400 mb-2">Report Illustration</div>
                </div>
              </div>
              <div className="md:w-1/2 mb-6 md:mb-0 md:pl-8 order-0 md:order-1">
                <div className="bg-purple-900/30 p-3 rounded-full inline-block mb-4">
                  <span className="bg-purple-600 text-white w-10 h-10 flex items-center justify-center rounded-full text-xl font-bold">4</span>
                </div>
                <h3 className="text-2xl font-semibold mb-3">Get AI-Enhanced Results</h3>
                <p className="text-gray-400">
                  Receive a comprehensive report with AI-powered suggestions to fix accessibility issues and improve WCAG compliance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-800 border-t border-gray-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            © {new Date().getFullYear()} Compliance AI All rights reserved.
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            Built with Next.js and Tailwind CSS. Powered by Axe-core and Novita AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
