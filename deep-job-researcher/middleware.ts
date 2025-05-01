import { NextRequest, NextResponse } from "next/server";

// Simple in-memory store for rate limiting
// In production, use Redis or another external store
const ipRequestStore: Record<string, { count: number; lastReset: number }> = {};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute
const API_PATHS = ["/api/match-jobs", "/api/summarize"];

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (!API_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get the IP from Vercel's forwarded header or fall back to connection remote address
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();

  if (!ipRequestStore[ip]) {
    ipRequestStore[ip] = {
      count: 0,
      lastReset: now,
    };
  }

  // Reset the count if outside the window
  if (now - ipRequestStore[ip].lastReset > RATE_LIMIT_WINDOW_MS) {
    ipRequestStore[ip] = {
      count: 0,
      lastReset: now,
    };
  }

  // Increment the count
  ipRequestStore[ip].count++;

  // Set rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", MAX_REQUESTS_PER_WINDOW.toString());
  response.headers.set(
    "X-RateLimit-Remaining",
    Math.max(0, MAX_REQUESTS_PER_WINDOW - ipRequestStore[ip].count).toString(),
  );
  response.headers.set(
    "X-RateLimit-Reset",
    new Date(ipRequestStore[ip].lastReset + RATE_LIMIT_WINDOW_MS).toISOString(),
  );

  // Check if rate limit exceeded
  if (ipRequestStore[ip].count > MAX_REQUESTS_PER_WINDOW) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(
            ipRequestStore[ip].lastReset + RATE_LIMIT_WINDOW_MS,
          ).toISOString(),
          "Retry-After": Math.ceil(
            (ipRequestStore[ip].lastReset + RATE_LIMIT_WINDOW_MS - now) / 1000,
          ).toString(),
        },
      },
    );
  }

  return response;
}

// Only run the middleware on API routes
export const config = {
  matcher: "/api/:path*",
};
