'use client';

import IssuesPieChart from '@/components/results-page/IssuesPieChart';

export default function ReportsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-4xl">
        <IssuesPieChart />
      </div>
    </div>
  );
}
