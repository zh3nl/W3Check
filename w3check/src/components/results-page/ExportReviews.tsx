'use client';

import { IncompleteItem } from '../../types';

interface ExportReviewsProps {
  incompleteItems: IncompleteItem[];
  url: string;
  timestamp: string;
}

export default function ExportReviews({ incompleteItems, url, timestamp }: ExportReviewsProps) {
  const exportToCSV = () => {
    if (incompleteItems.length === 0) {
      alert('No review data to export');
      return;
    }

    const headers = [
      'URL',
      'Scan Date',
      'Rule ID',
      'Description',
      'Review Status',
      'Review Notes',
      'Reviewed At',
      'Element HTML',
      'WCAG Tags'
    ];

    const csvData = incompleteItems.map(item => [
      url,
      new Date(timestamp).toLocaleDateString(),
      item.id,
      `"${item.description.replace(/"/g, '""')}"`,
      item.reviewStatus || 'pending',
      `"${(item.reviewNotes || '').replace(/"/g, '""')}"`,
      item.reviewedAt ? new Date(item.reviewedAt).toLocaleDateString() : '',
      `"${item.nodes[0]?.html?.replace(/"/g, '""') || ''}"`,
      item.tags.join(', ')
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url2 = URL.createObjectURL(blob);
    link.setAttribute('href', url2);
    link.setAttribute('download', `accessibility-review-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (incompleteItems.length === 0) {
      alert('No review data to export');
      return;
    }

    const exportData = {
      url,
      scanDate: timestamp,
      reviewDate: new Date().toISOString(),
      totalItems: incompleteItems.length,
      reviewedItems: incompleteItems.filter(item => item.reviewStatus !== 'pending').length,
      items: incompleteItems
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url2 = URL.createObjectURL(blob);
    link.setAttribute('href', url2);
    link.setAttribute('download', `accessibility-review-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (incompleteItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Export Review Results</h3>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            Export JSON
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>Export your manual review results for reporting or further analysis.</p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li><strong>CSV:</strong> Compatible with Excel, Google Sheets, and other spreadsheet applications</li>
          <li><strong>JSON:</strong> Structured data format for integration with other tools</li>
        </ul>
      </div>
    </div>
  );
} 