'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import validator from 'validator';
import { z } from 'zod';
import { ScanResult } from '../../types';

const formSchema = z.object({
  url: z.string()
    .trim()
    .refine((val: string) => validator.isURL(val, { require_protocol: true }), {
      message: 'Please enter a valid URL with http:// or https://'
    }),
  country: z.string().default('US'),
  depth: z.number().int().min(1).max(10).default(1),
  batchMode: z.boolean().default(false),
  batchUrls: z.string().optional()
});

type FormInputs = {
  url: string;
  country: string;
  depth: number;
  batchMode: boolean;
  batchUrls?: string;
};

type UrlFormProps = {
  onScanComplete: (result: ScanResult | ScanResult[]) => void;
  onScanError: (error: Error) => void;
  isLoading: boolean;
};

export default function UrlBar({ onScanComplete, onScanError, isLoading }: UrlFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      url: '',
      country: 'US',
      depth: 1,
      batchMode: false,
      batchUrls: ''
    }
  });
  
  const batchMode = watch('batchMode');

  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    try {
            
      const payload = batchMode ? 
        { urls: data.batchUrls?.split('\n').filter((url: string) => url.trim()), maxDepth: data.depth, country: data.country } : 
        { url: data.url, maxDepth: data.depth, country: data.country };
      
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
      
      const result = await response.json();
      onScanComplete(result);
    } catch (error) {
      onScanError(error instanceof Error ? error : new Error('An unknown error occurred'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-3xl mx-auto">
      <div className="flex gap-2">
        <div className="flex-1">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </span>


            <input
              type="text"
              id="url"
              placeholder="Type Website's URL"
              {...register('url')}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-l-lg focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 placeholder-gray-400 bg-white"
              disabled={isLoading}
            />


          </div>
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        <div className="w-48">
          <select
            {...register('country')}
            className="block w-full py-3 pl-3 pr-10 border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 rounded-r-lg bg-white text-gray-900"
            disabled={isLoading}
          >
            <option value="US" className="text-gray-900">
              🇺🇸 United States
            </option>
            <option value="GB" className="text-gray-900">
              🇬🇧 United Kingdom
            </option>
            <option value="CA" className="text-gray-900">
              🇨🇦 Canada
            </option>
            <option value="AU" className="text-gray-900">
              🇦🇺 Australia
            </option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-medium text-white ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
          }`}
        > 

          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Scanning...
            </div>
          ) : (
            'Scan website'
          )}
        </button>
      </div>

      <input type="hidden" {...register('depth')} value="1" />
    </form>
  );
} 