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
        { error: "Rate limit exceeded. Please try again in a minute." },
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

    // Validate URLs and provide specific error messages
    const validationResults = urls.map((url) => {
      try {
        const parsedUrl = new URL(url);
        // Check for common issues
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          return {
            isValid: false,
            url,
            error: "URL must use HTTP or HTTPS protocol",
          };
        }
        if (
          parsedUrl.hostname === "localhost" ||
          parsedUrl.hostname.includes("127.0.0.1")
        ) {
          return { isValid: false, url, error: "Local URLs are not supported" };
        }
        return { isValid: true, url };
      } catch (e) {
        return { isValid: false, url, error: "Invalid URL format" };
      }
    });

    const invalidUrls = validationResults.filter((result) => !result.isValid);
    if (invalidUrls.length > 0) {
      const errorMessages = invalidUrls.map(
        (result) => `${result.url}: ${result.error}`,
      );
      return NextResponse.json(
        { error: "Invalid URLs detected:\n" + errorMessages.join("\n") },
        { status: 400 },
      );
    }

    const validUrls = validationResults.map((result) => result.url);

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
  } catch (error: any) {
    console.error("Error extracting content:", error);

    // Handle specific error types
    if (error.response) {
      if (error.response.status === 403) {
        return NextResponse.json(
          {
            error:
              "Access to this URL is forbidden. This could be because:\n1. The website blocks content extraction\n2. The content requires authentication\n3. You don't have permission to access this content",
          },
          { status: 403 },
        );
      } else if (error.response.status === 404) {
        return NextResponse.json(
          {
            error:
              "The URL content could not be found. Please:\n1. Check if the URL is correct\n2. Ensure the page is publicly accessible\n3. Try using the main website URL instead",
          },
          { status: 404 },
        );
      } else if (error.response.status === 401) {
        return NextResponse.json(
          {
            error:
              "Authentication failed. Please update your Firecrawl API key or check your permissions.",
          },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Failed to extract content. Please check if:\n1. The URLs are accessible\n2. You have the correct permissions\n3. The website allows content extraction",
      },
      { status: 500 },
    );
  }
}
