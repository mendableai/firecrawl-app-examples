import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // This endpoint is no longer needed since we're using the Anthropic SDK directly
  // But we'll keep it to avoid breaking existing code and just return a warning

  return NextResponse.json({
    warning:
      "This API route is deprecated. The application now uses the Anthropic SDK directly.",
    message:
      "Please use the direct SDK integration instead of this proxy route.",
  });
}
