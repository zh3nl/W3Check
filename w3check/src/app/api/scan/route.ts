import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';
import { scanSingleUrl, scanBatchUrls } from '@/functions/scanner';
import { getClientIP, isZodError } from '@/functions/server-utils';

// Rate limiting variables (for production this should use Redis or similar)
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute
const ipRequestRegistry = new Map<string, { count: number, resetTime: number }>();

// Request schemas
const singleUrlSchema = z.object({
  url: z.string().trim().refine((val: string) => validator.isURL(val, { require_protocol: true }), {
    message: 'Please enter a valid URL with http:// or https://'
  }),
  maxDepth: z.number().int().min(1).max(100).default(1), // Allow up to 100 for full site crawling
  country: z.string().optional()
});

const batchUrlSchema = z.object({
  urls: z.array(z.string().trim().refine((val: string) => validator.isURL(val, { require_protocol: true }), {
    message: 'Please enter valid URLs with http:// or https://'
  })).min(1).max(50),
  maxDepth: z.number().int().min(1).max(100).default(1), // Allow up to 100 for full site crawling
  country: z.string().optional()
});

// Check rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestRegistry.get(ip);
  
  if (!record) {
    ipRequestRegistry.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > record.resetTime) {
    ipRequestRegistry.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count += 1;
  ipRequestRegistry.set(ip, record);
  return true;
}

export async function POST(request: NextRequest) {
  // Get IP for rate limiting
  const ip = getClientIP(request);
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }
  
  try {
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body)); // Log the request body for debugging
    
    // Check if it's a batch request or single URL
    if (Array.isArray(body.urls)) {
      const validatedData = batchUrlSchema.parse(body);
      const scanId = uuidv4();
      
      // Process batch of URLs
      const results = await scanBatchUrls(
        validatedData.urls, 
        validatedData.maxDepth,
        scanId
      );
      
      return NextResponse.json(results);
    } else {
      const validatedData = singleUrlSchema.parse(body);
      const scanId = uuidv4();
      
      // Process the URL
      const result = await scanSingleUrl(
        validatedData.url, 
        validatedData.maxDepth,
        scanId
      );
      
      // If result is an array (when crawling multiple pages), return it directly
      // Otherwise wrap the single result in an array for consistent response format
      const formattedResult = Array.isArray(result) ? result : [result];
      
      return NextResponse.json(formattedResult);
    }
  } catch (error: unknown) {
    if (isZodError(error)) {
      console.error('Validation error:', JSON.stringify((error as z.ZodError).errors)); // Log validation errors
      return NextResponse.json(
        { error: 'Validation error', details: (error as z.ZodError).errors },
        { status: 400 }
      );
    }
    
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Failed to process scan request' },
      { status: 500 }
    );
  }
} 