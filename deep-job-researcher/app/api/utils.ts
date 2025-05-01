import { NextResponse } from "next/server";

// TypeScript type for API responses
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
};

// Error codes
export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
};

// Status codes mapping
const statusCodes: Record<string, number> = {
  [ErrorCodes.BAD_REQUEST]: 400,
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.RATE_LIMIT]: 429,
  [ErrorCodes.INTERNAL_ERROR]: 500,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
};

// Success response helper
export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
  });
}

// Error response helper
export function errorResponse(
  message: string,
  code: string = ErrorCodes.INTERNAL_ERROR,
  details?: any,
): NextResponse<ApiResponse> {
  const status = statusCodes[code] || 500;

  // Log errors to the console for server-side debugging
  console.error(`API Error [${code}]: ${message}`, details ? { details } : "");

  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        details: process.env.NODE_ENV === "development" ? details : undefined,
      },
    },
    { status },
  );
}

// Validate request data against a schema
export function validateRequest<T>(
  data: unknown,
  validator: (data: unknown) => { success: boolean; data?: T; error?: Error },
): { valid: boolean; data?: T; error?: string } {
  try {
    const result = validator(data);
    if (result.success) {
      return { valid: true, data: result.data as T };
    } else {
      return {
        valid: false,
        error: result.error?.message || "Validation error",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

// Try-catch wrapper for API handlers
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
): Promise<{ success: boolean; result?: T; error?: Error }> {
  try {
    const result = await fn();
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error(typeof error === "string" ? error : "Unknown error"),
    };
  }
}

// Check if OpenAI API key is configured
export function isOpenAIKeyConfigured(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;
  return !!(apiKey && apiKey !== "your_openai_api_key_here");
}
