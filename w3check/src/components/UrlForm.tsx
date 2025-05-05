'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { ScanResult } from '../types';

type FormInputs = {
  url: string;
  depth: number;
  crawlEntireSite: boolean;
  batchMode: boolean;
  batchUrls?: string;
};

type UrlFormProps = {
  onScanStart: () => void;
  onScanComplete: (results: ScanResult[]) => void;
  onScanError: (error: Error) => void;
  isLoading: boolean;
};

export default function UrlForm({ onScanStart, onScanComplete, onScanError, isLoading }: UrlFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      url: '',
      depth: 1,
      crawlEntireSite: false,
      batchMode: false,
      batchUrls: ''
    }
  });
  
  const batchMode = watch('batchMode');
  const crawlEntireSite = watch('crawlEntireSite');

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
      onScanStart();
      
      // When crawling entire site, use a high depth value
      const maxDepth = data.crawlEntireSite ? 100 : data.depth;
      
      const payload = batchMode ? 
        { urls: data.batchUrls?.split('\n').filter((url: string) => url.trim()), maxDepth } : 
        { url: data.url, maxDepth };
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to scan URL');
      }
      
      const results = await response.json();
      // Ensure results is always an array
      onScanComplete(Array.isArray(results) ? results : [results]);
    } catch (error) {
      onScanError(error instanceof Error ? error : new Error('An unknown error occurred'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="batchMode" 
              {...register('batchMode')} 
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="batchMode" className="text-sm font-medium">
              Batch Mode
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="crawlEntireSite" 
              {...register('crawlEntireSite')} 
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="crawlEntireSite" className="text-sm font-medium">
              Crawl Entire Website
            </label>
          </div>
        </div>
      </div>

      {!batchMode ? (
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-medium">
            Website URL
          </label>
          <input
            type="text"
            id="url"
            placeholder="https://example.com"
            {...register('url')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="batchUrls" className="block text-sm font-medium">
            Multiple URLs (One per line)
          </label>
          <textarea
            id="batchUrls"
            rows={5}
            placeholder="https://example.com&#10;https://example.org"
            {...register('batchUrls')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          />
          {errors.batchUrls && (
            <p className="mt-1 text-sm text-red-600">{errors.batchUrls.message}</p>
          )}
        </div>
      )}

      {!crawlEntireSite && (
        <div className="space-y-2">
          <label htmlFor="depth" className="block text-sm font-medium">
            Crawl Depth (1-10)
          </label>
          <input
            type="number"
            id="depth"
            min={1}
            max={10}
            {...register('depth', { valueAsNumber: true })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={isLoading}
          />
          {errors.depth && (
            <p className="mt-1 text-sm text-red-600">{errors.depth.message}</p>
          )}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </>
          ) : (
            'Start Scan'
          )}
        </button>
      </div>
    </form>
  );
} 