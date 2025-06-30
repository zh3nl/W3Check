'use client';

import { IncompleteItem } from '../../types';

interface ReviewSummaryProps {
  incompleteItems: IncompleteItem[];
}

export default function ReviewSummary({ incompleteItems }: ReviewSummaryProps) {
  const totalItems = incompleteItems.length;
  const pendingReview = incompleteItems.filter(item => item.reviewStatus === 'pending').length;
  const passedReview = incompleteItems.filter(item => item.reviewStatus === 'passed').length;
  const failedReview = incompleteItems.filter(item => item.reviewStatus === 'failed').length;
  const notApplicable = incompleteItems.filter(item => item.reviewStatus === 'not-applicable').length;
  const reviewedItems = totalItems - pendingReview;

  const reviewProgress = totalItems > 0 ? (reviewedItems / totalItems) * 100 : 0;

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Manual Review Progress</h3>
        <div className="text-sm text-gray-500">
          {reviewedItems} of {totalItems} reviewed
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(reviewProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${reviewProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingReview}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{passedReview}</div>
          <div className="text-xs text-gray-500">Passed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{failedReview}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{notApplicable}</div>
          <div className="text-xs text-gray-500">Not Applicable</div>
        </div>
      </div>

      {/* Review Status */}
      {reviewedItems === totalItems && (
        <div className="mt-4 p-3 bg-green-50 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">
              All items have been manually reviewed
            </span>
          </div>
        </div>
      )}

      {failedReview > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">
              {failedReview} item{failedReview > 1 ? 's' : ''} failed manual review
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 