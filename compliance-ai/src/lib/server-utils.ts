import { NextRequest } from 'next/server';

interface ZodLikeError {
  errors: unknown; 
}

/**
 * Gets the client IP address from the NextRequest object
 * Works with various deployment environments including Vercel, standard proxies
 */
export function getClientIP(request: NextRequest): string {
  // Read from headers commonly set by proxies
  const forwardedFor = request.headers.get('x-forwarded-for');
  
  if (forwardedFor) {
    // Get the first IP if multiple are present (client, proxy1, proxy2, etc.)
    return forwardedFor.split(',')[0].trim();
  }
  
  // Use remoteAddress from NextRequest if available
  const ip = request.ip;
  
  // Return whatever we found, or a placeholder
  return ip || 'unknown';
}

/**
 * Custom error handler for API routes
 */
export class APIError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

/**
 * Type guard to check if an unknown error is a ZodError
 */
export function isZodError(error: unknown): error is ZodLikeError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'errors' in error && 
    Array.isArray((error as Record<string, unknown>).errors)
  );
} 