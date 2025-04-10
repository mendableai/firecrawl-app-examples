import axios from "axios";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

export interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  insights: string;
}

export interface ScrapedData {
  title: string;
  headline: string;
  subheadline?: string;
  ctaText?: string;
  heroImage?: string;
  content: string;
}

// Define extraction schema for CRO data
const contentSchema = z.object({
  title: z.string(),
  headline: z.string(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  heroImage: z.string().optional(),
  contentSummary: z.string(),
});

class ApiService {
  private firecrawlApiKey: string | null = null;
  private firecrawlClient: FirecrawlApp | null = null;

  constructor() {
    // Initialize from environment variables if available
    if (typeof window !== "undefined") {
      // Client-side: check localStorage for Firecrawl key
      const storedFirecrawlKey = localStorage.getItem("firecrawl_api_key");
      const envKey = window.ENV?.FIRECRAWL_API_KEY;

      console.log("API Key sources:", {
        localStorage: storedFirecrawlKey ? "present" : "not found",
        envVar: envKey ? "present" : "not found",
      });

      this.firecrawlApiKey = storedFirecrawlKey || envKey || null;
      this.initializeClients();
    }
  }

  private initializeClients() {
    if (this.firecrawlApiKey) {
      // Log the key format (safely)
      const keyLength = this.firecrawlApiKey.length;
      const hasPrefix = this.firecrawlApiKey.startsWith("fc-");
      console.log("Firecrawl key format:", {
        length: keyLength,
        hasPrefix,
        firstChars: this.firecrawlApiKey.substring(0, 3),
      });

      // No automatic prefix adding - use the key as is
      try {
        this.firecrawlClient = new FirecrawlApp({
          apiKey: this.firecrawlApiKey,
        });
        console.log("Firecrawl client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Firecrawl client:", error);
        this.firecrawlClient = null;
      }
    } else {
      console.warn("No Firecrawl API key provided");
      this.firecrawlClient = null;
    }
  }

  setFirecrawlApiKey(apiKey: string) {
    // Remove any whitespace from the entire key
    const cleanKey = apiKey.trim().replace(/\s+/g, "");

    // Basic validation
    if (!cleanKey) {
      throw new Error("API key cannot be empty");
    }

    // Validate the key format
    if (!cleanKey.startsWith("fc-")) {
      throw new Error('API key must start with "fc-"');
    }

    // Log key format (safely)
    console.log("Setting Firecrawl key:", {
      length: cleanKey.length,
      hasPrefix: cleanKey.startsWith("fc-"),
      firstChars: cleanKey.substring(0, 3),
    });

    this.firecrawlApiKey = cleanKey;

    if (typeof window !== "undefined") {
      localStorage.setItem("firecrawl_api_key", cleanKey);
      console.log("Stored Firecrawl key in localStorage");
    }

    // Re-initialize the client with the new key
    this.initializeClients();

    return this;
  }

  getFirecrawlApiKey(): string | null {
    return this.firecrawlApiKey;
  }

  clearFirecrawlApiKey() {
    this.firecrawlApiKey = null;
    this.firecrawlClient = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("firecrawl_api_key");
      console.log("Cleared Firecrawl key from localStorage");
    }
  }

  hasRequiredApiKeys(): boolean {
    return !!this.firecrawlApiKey;
  }

  async scrapeWebsite(url: string): Promise<ScrapedData> {
    if (!this.firecrawlApiKey || !this.firecrawlClient) {
      const error = new Error("Firecrawl API key not set or invalid");
      const details = {
        hasKey: !!this.firecrawlApiKey,
        keyLength: this.firecrawlApiKey?.length,
        hasPrefix: this.firecrawlApiKey?.startsWith("fc-"),
        hasClient: !!this.firecrawlClient,
      };
      console.error("Firecrawl configuration error:", error.message, details);
      throw error;
    }

    try {
      console.log(`Scraping website: ${url}`);

      // Use the Firecrawl extract API to get structured data
      const extractionPrompt = `Analyze the landing page of this website for conversion rate optimization (CRO). Focus on extracting the following key elements:
	1.	Main Headline: Summarize the core message that captures visitors' attention.
	2.	Subheadline: Capture any additional clarifying or supporting message beneath the main headline.
	3.	Call-to-Action (CTA) Text: Identify any calls to action, buttons, or links that prompt user engagement.
	4.	Hero Image: Describe any prominent images, graphics, or visuals used at the top of the page, especially those that support the message.
	5.	Content Summary: Provide a detailed summary of the entire page's content, including the following:
	•	Value Propositions: Main reasons why visitors should use the product or service.
	•	Features: List of product or service features highlighted on the page.
	•	Benefits: How the product/service benefits the target audience.
	•	Additional Sections: Any other sections that support user conversion, such as testimonials, social proof, trust signals, or pricing.

Conversion Rate Optimization (CRO) Focus: Provide insights into how each element can be optimized to increase conversions, including recommendations for improving the headline, CTA, or other aspects based on common CRO best practices.`;

      console.log("Making Firecrawl API call with key format:", {
        keyLength: this.firecrawlApiKey.length,
        hasPrefix: this.firecrawlApiKey.startsWith("fc-"),
        firstChars: this.firecrawlApiKey.substring(0, 3),
      });

      const scrapeResult = await this.firecrawlClient.extract([url], {
        prompt: extractionPrompt,
        schema: contentSchema,
      });

      if (!scrapeResult.success) {
        const error = new Error(
          `Firecrawl extraction failed: ${scrapeResult.error}`,
        );
        console.error("Firecrawl extraction error:", {
          error: scrapeResult.error,
          url,
          response: scrapeResult,
        });
        throw error;
      }

      if (!scrapeResult.data) {
        const error = new Error("Firecrawl extraction returned no data");
        console.error("Firecrawl data error:", {
          url,
          response: scrapeResult,
        });
        throw error;
      }

      console.log("Scraping response:", scrapeResult.data);

      return {
        title: scrapeResult.data.title || "Unknown Title",
        headline: scrapeResult.data.headline || "Unknown Headline",
        subheadline: scrapeResult.data.subheadline,
        ctaText: scrapeResult.data.ctaText,
        heroImage: scrapeResult.data.heroImage,
        content: scrapeResult.data.contentSummary || "No content found",
      };
    } catch (error: any) {
      // Enhanced error logging with better handling of empty objects
      // Create a custom error with more context if the original error is empty
      if (!error || Object.keys(error).length === 0) {
        error = new Error(
          "Unknown Firecrawl error - possibly blocked by target website",
        );
        error.name = "FirecrawlAccessError";
      }

      // Add specific error types for status codes and common errors
      const originalMessage = error.message || "Unknown error";

      if (
        error.message?.includes("status code 400") ||
        error.message?.includes("Request failed with status code 400") ||
        error.response?.status === 400 ||
        error.status === 400
      ) {
        error.name = "WebsiteAccessDeniedError";
        error.message =
          "This website blocks web scraping or has restricted access. Please try a different site.";
      } else if (
        error.message?.toLowerCase().includes("forbidden") ||
        error.message?.toLowerCase().includes("access denied") ||
        error.response?.status === 403 ||
        error.status === 403
      ) {
        error.name = "WebsiteAccessDeniedError";
        error.message =
          "This website blocks web scraping. Please try a different site.";
      }

      // Log technical details only for developers - this won't be visible to users
      // For user-facing errors, we'll display a friendly message in the UI
      console.debug(`[Developer] Firecrawl error details for URL ${url}:`, {
        originalError: originalMessage,
        errorName: error.name,
        userMessage: error.message,
        responseStatus: error.response?.status || error.status,
        responseData: error.response?.data,
        stack: error.stack?.split("\n").slice(0, 3).join("\n"), // Just show first few lines of stack
      });

      // Ensure the error has a message
      if (!error.message) {
        error.message =
          "Failed to scrape website - the site may be blocking access";
      }

      throw error;
    }
  }

  async analyzeCRO(scrapedData: ScrapedData): Promise<AnalysisResult> {
    try {
      const response = await axios.post("/api/analyze", { scrapedData });
      return response.data;
    } catch (error: any) {
      // Use developer-friendly logging that won't appear prominently in console
      const originalMessage = error?.message || "Unknown error";

      console.debug("[Developer] Error analyzing with server-side API:", {
        originalError: originalMessage,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      // Ensure error has a user-friendly message
      if (!error) {
        error = new Error("Failed to analyze content. Please try again.");
      } else if (!error.message) {
        error.message = "Error during content analysis. Please try again.";
      }

      throw error;
    }
  }
}

// Add ENV type to the Window interface
declare global {
  interface Window {
    ENV?: {
      FIRECRAWL_API_KEY?: string;
    };
  }
}

// Export a singleton instance
export const apiService = new ApiService();
