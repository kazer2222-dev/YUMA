import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    const current = rateLimitStore.get(ip);
    
    if (!current || current.resetTime < now) {
      // First request or window expired
      rateLimitStore.set(ip, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { allowed: true, remaining: config.maxRequests - 1 };
    }

    if (current.count >= config.maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: current.resetTime
      };
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(ip, current);

    return { 
      allowed: true, 
      remaining: config.maxRequests - current.count 
    };
  };
}

export function createRateLimitResponse(resetTime?: number) {
  const headers = new Headers();
  if (resetTime) {
    headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());
  }
  
  return new Response(
    JSON.stringify({ 
      success: false, 
      message: 'Too many requests. Please try again later.' 
    }),
    { 
      status: 429, 
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(headers.entries())
      }
    }
  );
}
















