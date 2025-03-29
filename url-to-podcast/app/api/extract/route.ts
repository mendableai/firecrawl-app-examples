import { NextRequest, NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

// Rate limiting - simple in-memory store
// In production, use a proper rate limiting solution like Redis
const RATE_LIMIT = {
  maxRequests: 5, // Maximum requests per window
  windowMs: 60 * 1000, // 1 minute window
  ipRequests: new Map<string, { count: number; resetTime: number }>(),
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";

    // Check rate limit
    const now = Date.now();
    const requestData = RATE_LIMIT.ipRequests.get(ip) || {
      count: 0,
      resetTime: now + RATE_LIMIT.windowMs,
    };

    // Reset counter if window has passed
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + RATE_LIMIT.windowMs;
    }

    // Increment counter and check limit
    requestData.count++;
    RATE_LIMIT.ipRequests.set(ip, requestData);

    if (requestData.count > RATE_LIMIT.maxRequests) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one valid URL" },
        { status: 400 },
      );
    }

    // Limit number of URLs to prevent abuse
    const MAX_URLS = 3;
    if (urls.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_URLS} URLs allowed per request` },
        { status: 400 },
      );
    }

    // Validate URLs
    const validUrls = urls.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 },
      );
    }

    // Get API key from request header or fallback to env variable
    const apiKeyHeader = request.headers.get("X-Firecrawl-API-Key");
    const apiKey = apiKeyHeader || process.env.FIRECRAWL_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Firecrawl API key is not provided" },
        { status: 401 },
      );
    }

    // Format API key with fc- prefix if missing
    const formattedApiKey = apiKey.startsWith("fc-") ? apiKey : `fc-${apiKey}`;

    const app = new FirecrawlApp({
      apiKey: formattedApiKey,
    });

    // Enhanced extraction to better identify podcastable content
    const schema = z.object({
      title: z.string(),
      main_content: z.string(),
      key_points: z.array(z.string()),
      summary: z.string(),
      news_items: z
        .array(
          z.object({
            title: z.string(),
            description: z.string(),
            url: z.string().optional(),
          }),
        )
        .optional(),
    });

    // Enhanced prompt to better extract podcastable content from any type of website
    const enhancedPrompt = `
    Extract content from this page to create an engaging podcast.
    
    If this page contains news, articles, or trending topics:
    1. Identify the most important/trending articles or topics
    2. Extract their titles, descriptions, and links when available
    3. Extract key points that would be interesting to discuss
    
    If this is a single article or content page:
    1. Extract the main content, ensuring it's comprehensive
    2. Identify the key talking points for a podcast
    3. Create a brief summary
    
    For any type of page:
    - Focus on extracting content that would be engaging to hear in a podcast
    - Ensure the main content captures the most important information
    - Identify conversation-worthy points
    `;

    const scrapeResult = await app.extract(validUrls, {
      prompt: enhancedPrompt,
      schema: schema,
    });

    if (!scrapeResult.success) {
      return NextResponse.json(
        { error: `Failed to extract content: ${scrapeResult.error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: scrapeResult.data,
    });
  } catch (error) {
    console.error("Error extracting content:", error);
    return NextResponse.json(
      { error: "Failed to extract content from URLs" },
      { status: 500 },
    );
  }
}
