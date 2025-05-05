'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoadingSpinner({ size = 32 }) {
  return (
    <div className={`animate-spin rounded-full border-4 border-blue-200 border-t-blue-600`} style={{ width: size, height: size }} />
  );
}

function ShimmerRow() {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="h-4 w-4 rounded bg-blue-100" />
      <div className="flex-1 h-4 rounded bg-blue-50 animate-pulse" />
      <div className="w-16 h-4 rounded bg-blue-50 animate-pulse" />
      <div className="w-16 h-4 rounded bg-blue-50 animate-pulse" />
    </div>
  );
}

export default function BufferPage() {
  const router = useRouter();
  const params = useSearchParams();
  const url = params.get('url') || 'https://example.com';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left sidebar */}
      <div className="w-[320px] flex flex-col items-center pt-8 px-6 bg-white border-r border-gray-100 min-h-screen">
        <button className="flex items-center text-gray-500 mb-8 self-start" onClick={() => router.push('/')}> 
          <span className="mr-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          Back to Home
        </button>
        <LoadingSpinner size={48} />
        <div className="flex items-center mt-8 p-3 rounded-lg bg-white-50 border border-gray-100">
          <span className="text-blue-600 mr-2">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2V7m6 7a6 6 0 11-12 0 6 6 0 0112 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-700 underline text-sm">{url}</a>
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 p-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Scanning <span className="text-blue-700">{url}</span>...
          </h2>
          <div className="flex items-center text-gray-600 mb-6">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            This may take a while. You will see the results when scanning is completed
          </div>
          {/* Loading cards */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="col-span-2 h-32 rounded-xl bg-gray-100 flex items-center justify-center relative overflow-hidden">
              <LoadingSpinner size={40} />
            </div>
            <div className="h-40 rounded-xl bg-white flex items-center justify-center shadow-md">
              <LoadingSpinner size={36} />
            </div>
            <div className="h-40 rounded-xl bg-white flex items-center justify-center shadow-md">
              <LoadingSpinner size={36} />
            </div>
          </div> */}
          {/* Shimmer table */}
          <div className="bg-white rounded-xl shadow p-6">
            {Array.from({ length: 10 }).map((_, i) => <ShimmerRow key={i} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
