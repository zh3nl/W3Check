'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

function LoadingSpinner({ size = 32 }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600`} style={{ width: size, height: size }} />
  );
}

function ShimmerRow() {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="h-4 w-4 rounded bg-emerald-100" />
      <div className="flex-1 h-4 rounded bg-emerald-50 animate-pulse" />
      <div className="w-16 h-4 rounded bg-emerald-50 animate-pulse" />
      <div className="w-16 h-4 rounded bg-emerald-50 animate-pulse" />
    </div>
  );
}

export default function BufferPage() {
  const params = useSearchParams();
  const url = params.get('url') || 'https://example.com';

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to right, #f7f9fd 0%, #f7f9fd 100%)' }}>
      <div className="max-w-4xl w-full mx-auto p-8">
        <div className="text-center mb-8">
          <LoadingSpinner size={64} />
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="text-emerald-600 mr-3">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2V7m6 7a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline text-lg font-medium">{url}</a>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Scanning <span className="text-emerald-700">{url}</span>...
          </h2>
          
          <div className="flex items-center justify-center text-gray-600 mb-8">
            <svg className="w-6 h-6 text-emerald-500 mr-3" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="text-lg">This may take a while. You will see the results when scanning is completed</span>
          </div>
        </div>
        
        {/* Shimmer table */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Preparing scan results...</h3>
          {Array.from({ length: 8 }).map((_, i) => <ShimmerRow key={i} />)}
        </div>
      </div>
    </div>
  );
}
