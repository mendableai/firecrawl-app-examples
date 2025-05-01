/**
 * Simple API logger middleware
 * This can be extended to use more sophisticated logging tools like Winston or Pino
 */

// Create a unique ID for each request
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Log request information
export function logRequest(
  requestId: string,
  method: string,
  url: string,
  body?: any,
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [REQ] [${requestId}] ${method} ${url}`,
    body
      ? `\nBody: ${JSON.stringify(body, null, 2).substring(0, 500)}${
          JSON.stringify(body).length > 500 ? "..." : ""
        }`
      : "",
  );
}

// Log response information
export function logResponse(
  requestId: string,
  status: number,
  responseBody?: any,
  responseTime?: number,
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [RES] [${requestId}] Status: ${status}${
      responseTime ? ` Time: ${responseTime}ms` : ""
    }`,
    responseBody
      ? `\nBody: ${JSON.stringify(responseBody, null, 2).substring(0, 500)}${
          JSON.stringify(responseBody).length > 500 ? "..." : ""
        }`
      : "",
  );
}

// Log error information
export function logError(
  requestId: string,
  error: Error | unknown,
  context?: string,
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(
    `[${timestamp}] [ERR] [${requestId}]${
      context ? ` [${context}]` : ""
    } ${errorMessage}`,
    errorStack ? `\nStack: ${errorStack}` : "",
  );
}

// Request timing middleware
export class RequestTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  public getElapsedTime(): number {
    return Date.now() - this.startTime;
  }
}

// Wrapper function to log API calls
export async function withLogging<T>(
  method: string,
  url: string,
  handler: () => Promise<T>,
  body?: any,
): Promise<T> {
  const requestId = generateRequestId();
  const timer = new RequestTimer();

  try {
    logRequest(requestId, method, url, body);
    const result = await handler();
    const responseTime = timer.getElapsedTime();

    // Check if this is a NextResponse to log it properly
    let status = 200;
    let responseBody = result;

    // If the response is a NextResponse, extract the status and body
    if (
      result &&
      typeof result === "object" &&
      "status" in result &&
      "body" in result
    ) {
      status = (result as any).status || 200;
      try {
        // Try to clone the response to read its body without consuming it
        const clone = structuredClone(result);
        if (
          clone &&
          typeof clone === "object" &&
          "json" in clone &&
          typeof clone.json === "function"
        ) {
          // This is a bit of a hack because NextResponse json() method is async
          // For logging purposes, we'll look at the internal state
          responseBody = (clone as any)._bodyInit || clone;
        }
      } catch (e) {
        // If we can't read the body, just log the result as is
        responseBody =
          "Unable to extract body from Response" as unknown as Awaited<T>;
      }
    }

    logResponse(requestId, status, responseBody, responseTime);

    // Just return the original result
    return result;
  } catch (error) {
    const responseTime = timer.getElapsedTime();
    logError(requestId, error, "API Call");
    throw error;
  }
}
