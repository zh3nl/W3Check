'use client';

import { useState } from 'react';
import { IncompleteItem } from '../../types';

interface ManualReviewProps {
  incompleteItems: IncompleteItem[];
  onReviewUpdate: (updatedItems: IncompleteItem[]) => void;
}

export default function ManualReview({ incompleteItems, onReviewUpdate }: ManualReviewProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleReviewStatusChange = (itemId: string, status: 'passed' | 'failed' | 'not-applicable') => {
    const updatedItems = incompleteItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          reviewStatus: status,
          reviewedAt: new Date().toISOString(),
          reviewNotes: reviewNotes[itemId] || ''
        };
      }
      return item;
    });
    onReviewUpdate(updatedItems);
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setReviewNotes(prev => ({
      ...prev,
      [itemId]: notes
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'not-applicable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return 'Passed';
      case 'failed': return 'Failed';
      case 'not-applicable': return 'Not Applicable';
      default: return 'Pending Review';
    }
  };

  if (incompleteItems.length === 0) {
    return (
      <div className="bg-green-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">No items need manual review</h3>
            <div className="mt-2 text-sm text-green-700">
              <p>All accessibility checks were able to be completed automatically.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Manual Review Required</h3>
        <div className="text-sm text-gray-500">
          {incompleteItems.filter(item => item.reviewStatus === 'pending').length} pending review
        </div>
      </div>

      <div className="space-y-3">
        {incompleteItems.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{item.id}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.reviewStatus || 'pending')}`}>
                      {getStatusText(item.reviewStatus || 'pending')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <a 
                      href={item.helpUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-700 underline"
                    >
                      View WCAG Guidelines
                    </a>
                    <button
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      {expandedItem === item.id ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>

                  {expandedItem === item.id && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <h5 className="text-xs font-medium text-gray-700 mb-2">Affected Elements:</h5>
                      {item.nodes.map((node, index) => (
                        <div key={index} className="mb-2">
                          <div className="text-xs text-gray-600 mb-1">Element {index + 1}:</div>
                          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                            {node.html}
                          </pre>
                          {node.failureSummary && (
                            <div className="text-xs text-gray-500 mt-1">
                              {node.failureSummary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Review Notes:
                    </label>
                    <textarea
                      value={reviewNotes[item.id] || ''}
                      onChange={(e) => handleNotesChange(item.id, e.target.value)}
                      placeholder="Add notes about your manual review..."
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => handleReviewStatusChange(item.id, 'passed')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      item.reviewStatus === 'passed'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                    }`}
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleReviewStatusChange(item.id, 'failed')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      item.reviewStatus === 'failed'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-white text-red-700 border border-red-300 hover:bg-red-50'
                    }`}
                  >
                    Fail
                  </button>
                  <button
                    onClick={() => handleReviewStatusChange(item.id, 'not-applicable')}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      item.reviewStatus === 'not-applicable'
                        ? 'bg-gray-100 text-gray-800 border border-gray-200'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    N/A
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Manual Review Required</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>These items require human judgment to determine if they meet accessibility standards. Please review each item and mark it as Pass, Fail, or Not Applicable.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 