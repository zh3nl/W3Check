'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ScanResult } from '../../types';
import Navbar from './Navbar';
import LogoCarousel from './Logo-Carousel';
import Footer from './Footer';

// Dynamically import components to avoid SSR issues with browser-only libraries
const UrlBar = dynamic(() => import('../scan-functions/UrlBar'), { ssr: false });

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleScanComplete = (results: ScanResult[]) => {
    // Store the results in localStorage
    const storedHistory = localStorage.getItem('scanHistory') || '[]';
    let history: ScanResult[] = JSON.parse(storedHistory);
    
    // Add new results to history
    history = [...results, ...history];
    localStorage.setItem('scanHistory', JSON.stringify(history));
    
    // Redirect to the results page with the first result
    if (results.length > 0) {
      router.push(`/results?id=${results[0].id}`);
    }
    
    setIsLoading(false);
    toast.success('Scan completed successfully!');
  };

  const handleScanError = (error: Error) => {
    setIsLoading(false);
    toast.error(`Scan failed: ${error.message || 'Unknown error'}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        <Navbar />
      </div>
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="pt-16"></div>

        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20">
              <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-full h-full">
                <g clipPath="url(#a)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/>
                </g>
                <defs>
                  <clipPath id="a">
                    <path fill="#fff" d="M0 0h16v16H0z"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find out if your website is <span className="text-green-700">Accessible</span> and <span className="text-green-700">Compliant</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our WCAG 2.2 compliance checker identifies web accessibility issues and gives exact instructions for fixing them.
          </p>
        </div>

        <div className="mb-12">
          <UrlBar 
            onScanComplete={handleScanComplete}
            onScanError={handleScanError}
            isLoading={isLoading}
          />
        </div>

        <div className="text-center mb-16">
          <p className="text-gray-600 mb-4">Checks for Compliances:</p>
          <div className="flex justify-center space-x-6">
            {['WCAG 2.2', 'ADA', 'EAA', 'Section 508', 'AODA'].map((standard) => (
              <div key={standard} className="flex items-center text-gray-700">
                <svg className="w-4 h-4 text-emerald-600 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                {standard}
              </div>
            ))}
          </div>
        </div>

        <LogoCarousel />
      </main>
      <Footer />
    </div>
  );
}
