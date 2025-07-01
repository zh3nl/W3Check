'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getUniqueScannedUrls } from '../../services/scanResults';

interface ScanResult {
  id: string;
  url: string;
  timestamp: string;
  // Add other fields as needed
}

export default function DashboardPage() {
  const [domains, setDomains] = useState<ScanResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        // Try to load from Supabase first
        const uniqueUrls = await getUniqueScannedUrls();
        setDomains(uniqueUrls);
      } catch (error) {
        console.log('Error fetching from Supabase, falling back to localStorage:', error);
        
        // Fallback to localStorage
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
      }
    };

    fetchDomains();
  }, []);

  const filteredDomains = domains.filter(domain =>
    domain.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(to right, #f7f9fd 0%, #f7f9fd 100%)' }}>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Accessibility at Your Domains</h1>
          <button className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-700 transition">+ Add domain</button>
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
            {/* <svg
              className="absolute right-3 top transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg> */}
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
                <Link href={`/results-page?id=${domain.id}`} className="mt-2 text-emerald-700 underline text-sm">View results</Link>
              </div>
            ))
          )}
        </div>
        {/* <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Issues</h2>
          <div className="flex flex-col items-center justify-center min-h-[120px]">
            <img src="/empty-state.svg" alt="No data" className="w-20 h-20 mb-4 opacity-60" />
            <div className="text-lg font-semibold mb-2">Select a site</div>
          </div>
        </div> */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-700">
          <span className="font-semibold">Important:</span> Automated monitoring <span className="font-bold">can&apos;t</span> identify all accessibility issues. <span className="underline text-emerald-700 cursor-pointer">Manual testing</span> by a human is required.
        </div>
      </div>
    </div>
  );
}
