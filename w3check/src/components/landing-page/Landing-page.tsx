'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ScanResult } from '../../types';
import Navbar from './Navbar';
import Footer from './Footer';
import Demo from './Demo';
import Security from './Security';

// Dynamically import components to avoid SSR issues with browser-only libraries
const UrlBar = dynamic(() => import('../scan-functions/UrlBar'), { ssr: false });

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleScanStart = (url: string) => {
    setIsLoading(true);
    router.push(`/buffer-page?url=${encodeURIComponent(url)}`);
  };

  const handleScanComplete = (results: ScanResult[]) => {
    // Store the results in localStorage
    const storedHistory = localStorage.getItem('scanHistory') || '[]';
    let history: ScanResult[] = JSON.parse(storedHistory);
    
    // Add new results to history
    history = [...results, ...history];
    localStorage.setItem('scanHistory', JSON.stringify(history));
    
    // Redirect to the results page with the first result
    if (results.length > 0) {
      router.push(`/results-page?id=${results[0].id}`);
    }
    
    setIsLoading(false);
    toast.success('Scan completed successfully!');
  };

  const handleScanError = (error: Error) => {
    setIsLoading(false);
    toast.error(`Scan failed: ${error.message || 'Unknown error'}`);
  };

  return (
    <div className="min-h-screen flex flex-col text-black" style={{ background: 'linear-gradient(to right, #f7f9fd 0%, #f7f9fd 100%)' }}>
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        <Navbar />
      </div>
      <main className="flex-grow w-full px-8 sm:px-16 lg:px-32 flex flex-col justify-center items-stretch pt-32 pb-12">
        <div className="flex flex-col md:flex-row w-full items-center justify-between gap-8 md:gap-12 lg:gap-16 xl:gap-24">
          {/* Left: Hero Section */}
          <div className="flex-1 min-w-[340px] max-w-2xl">
            <h1 className="text-5xl font-bold mb-8 text-gray-900">
              The future of <span className="text-black">site accessibility maintenance</span>
            </h1>
            <p className="text-lg text-gray-600 mb-12">
              Ensure web accessiblity compliance with 25+ intent signals and AI agents. Codebase analysis, suggested changes, and data analytics in one unified workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
              <div className="w-full sm:w-auto flex-1">
                <UrlBar 
                  onScanComplete={handleScanComplete}
                  onScanError={handleScanError}
                  isLoading={isLoading}
                  onScanStart={handleScanStart}
                />
              </div>
            </div>
            <div className="text-gray-500 text-base mt-4">Set up W3Check in minutes</div>
          </div>
          {/* Right: Demo Video Placeholder */}
          <div className="flex-1 flex justify-center items-center w-full max-w-2xl min-w-[340px]">
            <Demo />
          </div>
        </div>
        {/* Trusted by section */}
        <div className="w-full mt-32">

          {/* <LogoCarousel /> */}
        </div>
        {/* <Security /> */}
      </main>

      <Footer />
    </div>
  );
}
