'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ScanResult } from '../../types';

export default function DashboardPage() {
  const [domains, setDomains] = useState<ScanResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Load scan history from localStorage
    if (typeof window !== 'undefined') {
      const history = localStorage.getItem('scanHistory');
      if (history) {
        try {
          const parsed: ScanResult[] = JSON.parse(history);
          // Get unique domains by url
          const unique = Array.from(new Map(parsed.map(item => [item.url, item])).values());
          setDomains(unique);
        } catch {
          setDomains([]);
        }
      }
    }
  }, []);

  const filteredDomains = domains.filter(domain =>
    domain.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate review statistics
  const totalIncompleteItems = domains.reduce((sum, domain) => 
    sum + (domain.incompleteItems?.length || 0), 0
  );
  
  const pendingReviews = domains.reduce((sum, domain) => 
    sum + (domain.incompleteItems?.filter(item => item.reviewStatus === 'pending').length || 0), 0
  );
  
  const completedReviews = domains.reduce((sum, domain) => 
    sum + (domain.incompleteItems?.filter(item => item.reviewStatus !== 'pending').length || 0), 0
  );

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(to right, #f7f9fd 0%, #f7f9fd 100%)' }}>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accessibility at Your Domains</h1>
          <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition">+ Add domain</button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{pendingReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{completedReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Review Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalIncompleteItems > 0 ? Math.round((completedReviews / totalIncompleteItems) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {domains.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
              <Image src="/empty-state.svg" alt="No data" width={128} height={128} className="mb-4 opacity-60" />
              <div className="text-lg font-semibold mb-2">Select a site</div>
              <div className="text-gray-500 text-sm mb-2">No domains have been scanned yet. Use the scan tool to add your first domain.</div>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="text-lg font-semibold mb-2">No matching domains found</div>
              <div className="text-gray-500 text-sm mb-2">Try adjusting your search term</div>
            </div>
          ) : (
            filteredDomains.map(domain => (
              <div key={domain.url} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[220px]">
                <Image src="/empty-state.svg" alt="No data" width={80} height={80} className="mb-4 opacity-60" />
                <div className="text-lg font-semibold mb-2 break-all text-gray-900">{domain.url}</div>
                <div className="text-sm text-gray-500 mb-2">
                  Scanned: {new Date(domain.timestamp).toLocaleDateString()}
                </div>
                {domain.incompleteItems && domain.incompleteItems.length > 0 && (
                  <div className="text-sm text-yellow-600 mb-2">
                    {domain.incompleteItems.filter(item => item.reviewStatus === 'pending').length} pending reviews
                  </div>
                )}
                <Link href={`/results-page?id=${domain.id}`} className="mt-2 text-emerald-700 underline text-sm">View results</Link>
              </div>
            ))
          )}
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-700">
          <span className="font-semibold">Important:</span> Automated monitoring <span className="font-bold">can&apos;t</span> identify all accessibility issues. <span className="underline text-emerald-700 cursor-pointer">Manual testing</span> by a human is required.
        </div>
      </div>
    </div>
  );
}
