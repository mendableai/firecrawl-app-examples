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
      const extractionPrompt = `
        Extract key information from this website's landing page for conversion rate optimization analysis.
        Focus on the main headline, subheadline, call-to-action text, any hero image, and the entire page content.
        Provide a detailed summary of the main content in the contentSummary field, including main value propositions,
        features, benefits, and any additional sections that would be important for conversion rate optimization.
      `;

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
      // Enhanced error logging
      console.error("Error scraping website:", {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          details: error.details || {},
        },
        url,
        firecrawlKeyStatus: {
          length: this.firecrawlApiKey?.length,
          hasPrefix: this.firecrawlApiKey?.startsWith("fc-"),
        },
      });

      // For demo purposes, return mock data if API fails
      if (process.env.NODE_ENV === "development") {
        console.log("Using demo data since API call failed");
        return this.getMockScrapedData(url);
      }

      throw error;
    }
  }

  async analyzeCRO(scrapedData: ScrapedData): Promise<AnalysisResult> {
    try {
      const response = await axios.post("/api/analyze", { scrapedData });
      return response.data;
    } catch (error) {
      console.error("Error analyzing with server-side Anthropic:", error);
      return this.getFallbackAnalysis();
    }
  }

  private getMockScrapedData(url: string): ScrapedData {
    return {
      title: "Example Landing Page",
      headline: "Transform Your Website's Conversion Rate",
      subheadline: "AI-Powered Analysis & Recommendations",
      ctaText: "Get Started",
      content: "This is a mock content summary for development purposes.",
    };
  }

  private getFallbackAnalysis(): AnalysisResult {
    return {
      score: 76,
      strengths: [
        "Clear headline that communicates value proposition",
        "Contrasting CTA button that stands out",
      ],
      weaknesses: [
        "Subheadline is too long and doesn't reinforce the headline",
        "CTA text is generic and doesn't inspire action",
      ],
      recommendations: [
        "Shorten the subheadline to focus on key benefits",
        "Use more specific, action-oriented CTA text",
        "Add social proof elements near the CTA",
      ],
      insights:
        "The hero section has good foundational elements but needs refinement to maximize conversion potential. The headline effectively communicates the value proposition, but the supporting elements need to be strengthened to reinforce the core message and drive action.",
    };
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
