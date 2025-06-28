'use client';

import React from 'react';
import Sidenav from '@/components/Sidenav';

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Side Navigation */}
      <Sidenav />
      
      {/* Main Content */}
      <div className="ml-16 flex-1">
        {children}
      </div>
    </div>
  );
}
