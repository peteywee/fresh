import { NextResponse } from 'next/server';

/**
 * Optimized API response helpers for faster build times
 */

// Cache successful responses for better performance
const responseCache = new Map<string, { response: Response; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export function createSuccessResponse<T>(data: T, options?: ResponseInit): NextResponse {
  return NextResponse.json(
    { success: true, data },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        ...options?.headers,
      },
      ...options,
    }
  );
}

export function createErrorResponse(
  error: string,
  status: number = 400,
  options?: ResponseInit
): NextResponse {
  return NextResponse.json(
    { success: false, error },
    {
      status,
      headers: {
        'Cache-Control': 'no-cache',
        ...options?.headers,
      },
      ...options,
    }
  );
}

export function createValidationErrorResponse(errors: Record<string, string>): NextResponse {
  return NextResponse.json({ success: false, error: 'Validation failed', errors }, { status: 422 });
}

// Helper for consistent JSON parsing with better error handling
export async function parseRequestBody<T>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body as T;
  } catch (error) {
    console.error('JSON parsing error:', error);
    return null;
  }
}

// Rate limiting helper (dev-mode friendly)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
