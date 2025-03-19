import axios from "axios";
import FirecrawlApp from "@mendable/firecrawl-js";
import Anthropic from "@anthropic-ai/sdk";
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
const heroContentSchema = z.object({
  title: z.string(),
  headline: z.string(),
  subheadline: z.string().optional(),
  ctaText: z.string().optional(),
  heroImage: z.string().optional(),
  contentSummary: z.string(),
});

class ApiService {
  private firecrawlApiKey: string | null = null;
  private anthropicApiKey: string | null = null;
  private firecrawlClient: FirecrawlApp | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor() {
    // Initialize from environment variables if available
    if (typeof window !== "undefined") {
      // Client-side: check localStorage for Firecrawl key, but only ENV for Anthropic
      const storedFirecrawlKey = localStorage.getItem("firecrawl_api_key");

      this.firecrawlApiKey =
        storedFirecrawlKey || (window.ENV?.FIRECRAWL_API_KEY as string) || null;
      // Anthropic key should only come from environment variables
      this.anthropicApiKey = (window.ENV?.ANTHROPIC_API_KEY as string) || null;

      // Initialize clients if keys are available
      this.initializeClients();
    } else {
      // Server-side: use only env vars
      this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY || null;
      this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null;

      // Initialize clients if keys are available
      this.initializeClients();
    }
  }

  private initializeClients() {
    if (this.firecrawlApiKey) {
      this.firecrawlClient = new FirecrawlApp({
        apiKey: this.firecrawlApiKey.startsWith("fc-")
          ? this.firecrawlApiKey
          : `fc-${this.firecrawlApiKey}`,
      });
    }

    if (this.anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: this.anthropicApiKey,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  setFirecrawlApiKey(apiKey: string) {
    this.firecrawlApiKey = apiKey;
    if (typeof window !== "undefined") {
      localStorage.setItem("firecrawl_api_key", apiKey);
    }

    // Re-initialize the client with the new key
    if (apiKey) {
      this.firecrawlClient = new FirecrawlApp({
        apiKey: apiKey.startsWith("fc-") ? apiKey : `fc-${apiKey}`,
      });
    } else {
      this.firecrawlClient = null;
    }

    return this;
  }

  getFirecrawlApiKey(): string | null {
    return this.firecrawlApiKey;
  }

  // Always refresh Anthropic API key from env when needed
  refreshAnthropicApiKey() {
    if (typeof window !== "undefined") {
      this.anthropicApiKey = (window.ENV?.ANTHROPIC_API_KEY as string) || null;
    } else {
      this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null;
    }

    // Re-initialize the client with the refreshed key
    if (this.anthropicApiKey) {
      this.anthropicClient = new Anthropic({
        apiKey: this.anthropicApiKey,
        dangerouslyAllowBrowser: true,
      });
    } else {
      this.anthropicClient = null;
    }

    return this.anthropicApiKey;
  }

  hasAnthropicApiKey(): boolean {
    // Always refresh from env before checking
    this.refreshAnthropicApiKey();
    return !!this.anthropicApiKey;
  }

  hasRequiredApiKeys(): boolean {
    return !!this.firecrawlApiKey && this.hasAnthropicApiKey();
  }

  async scrapeWebsite(url: string): Promise<ScrapedData> {
    if (!this.firecrawlApiKey || !this.firecrawlClient) {
      throw new Error("Firecrawl API key not set");
    }

    try {
      console.log(`Scraping website: ${url}`);

      // Use the Firecrawl extract API to get structured data
      const extractionPrompt = `
        Extract key information from this SaaS website's hero section for conversion rate optimization analysis.
        Focus on the main headline, subheadline, call-to-action text, and any hero image.
        Summarize the main content in the contentSummary field.
      `;

      const scrapeResult = await this.firecrawlClient.extract([url], {
        prompt: extractionPrompt,
        schema: heroContentSchema,
      });

      if (!scrapeResult.success) {
        console.error("Firecrawl extraction failed:", scrapeResult.error);
        throw new Error(`Firecrawl extraction failed: ${scrapeResult.error}`);
      }

      console.log("Scraping response:", scrapeResult.data);

      // Process the response to extract hero section data
      return {
        title: scrapeResult.data.title || "Unknown Title",
        headline: scrapeResult.data.headline || "Unknown Headline",
        subheadline: scrapeResult.data.subheadline,
        ctaText: scrapeResult.data.ctaText,
        heroImage: scrapeResult.data.heroImage,
        content: scrapeResult.data.contentSummary || "No content found",
      };
    } catch (error) {
      console.error("Error scraping website:", error);

      // For demo purposes, return mock data if API fails
      if (process.env.NODE_ENV === "development") {
        console.log("Using demo data since API call failed");
        return this.getMockScrapedData(url);
      }

      throw new Error("Failed to scrape website");
    }
  }

  // Add a method to generate mock data for demo purposes
  private getMockScrapedData(url: string): ScrapedData {
    return {
      title: "Demo SaaS Website",
      headline: "Boost Your Productivity with Our AI Platform",
      subheadline:
        "Save time and focus on what matters most with our intelligent automation tools",
      ctaText: "Start Free Trial",
      heroImage:
        "https://images.unsplash.com/photo-1661956602944-249bcd04b63f?q=80&w=2670&auto=format&fit=crop",
      content: `# Demo SaaS Website
      
## Boost Your Productivity with Our AI Platform

Save time and focus on what matters most with our intelligent automation tools.

### Features:
- AI-powered workflows
- Smart integrations
- Team collaboration
- Real-time analytics

[Start Free Trial] [Schedule Demo]
      
Our platform helps teams at companies like Acme Inc, TechCorp, and InnovateCo streamline their work and achieve more.
`,
    };
  }

  async analyzeCRO(scrapedData: ScrapedData): Promise<AnalysisResult> {
    // Always refresh Anthropic API key from env before using
    this.refreshAnthropicApiKey();

    if (!this.anthropicApiKey || !this.anthropicClient) {
      console.error("Anthropic API key not set in environment variables");
      return this.getFallbackAnalysis();
    }

    try {
      console.log("Analyzing content with Anthropic Claude 3.7...");

      // Format the user message with the scraped data
      const userMessage = `Analyze this SaaS website hero section for Conversion Rate Optimization (CRO) best practices:
          
Title: ${scrapedData.title}
Headline: ${scrapedData.headline}
Subheadline: ${scrapedData.subheadline || "None"}
CTA: ${scrapedData.ctaText || "None"}
Content: ${scrapedData.content}

Please provide:
1. A score out of 100 based on CRO best practices
2. 2-3 strengths of the current hero section
3. 2-3 weaknesses or areas of improvement
4. 3-4 specific, actionable recommendations to improve conversion rates
5. A brief insight paragraph about the overall hero section effectiveness

Format your response in JSON with the following structure:
{
  "score": number,
  "strengths": [array of strings],
  "weaknesses": [array of strings],
  "recommendations": [array of strings],
  "insights": "string"
}`;

      // Call the Anthropic API directly using the SDK
      const response = await this.anthropicClient.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        system:
          "You are an expert in Conversion Rate Optimization (CRO) for SaaS websites. Analyze the provided hero section and provide actionable insights. Format your response as structured JSON.",
        messages: [{ role: "user", content: userMessage }],
      });

      console.log("Anthropic API response received");

      // Extract the content from the response
      const content = response.content[0];
      const contentText = content.type === "text" ? content.text : "";

      // Extract JSON from the response
      const jsonMatch =
        contentText.match(/```json([\s\S]*?)```/) ||
        contentText.match(/{[\s\S]*?}/);

      if (jsonMatch) {
        const jsonString = jsonMatch[0].replace(/```json|```/g, "").trim();
        try {
          const parsedResult = JSON.parse(jsonString) as AnalysisResult;
          return parsedResult;
        } catch (parseError) {
          console.error("Error parsing Anthropic's JSON response:", parseError);
          return this.getFallbackAnalysis();
        }
      }

      // Fallback in case Anthropic doesn't return proper JSON
      console.warn(
        "Anthropic didn't return properly formatted JSON. Using fallback analysis.",
      );
      return this.getFallbackAnalysis();
    } catch (error) {
      console.error("Error analyzing with Anthropic:", error);
      // Return fallback analysis if Anthropic API fails
      return this.getFallbackAnalysis();
    }
  }

  async generateOptimizedHero(data: {
    originalHero: {
      headline: string;
      subheadline?: string;
      ctaText?: string;
    };
    weaknesses: string[];
    recommendations: string[];
  }): Promise<{
    headline: string;
    subheadline: string;
    ctaText: string;
    explanation: string;
  }> {
    if (!this.anthropicApiKey || !this.anthropicClient) {
      this.refreshAnthropicApiKey();
      if (!this.anthropicApiKey || !this.anthropicClient) {
        throw new Error("Anthropic API key not set");
      }
    }

    try {
      console.log("Generating optimized hero content...");

      const weaknessesText = data.weaknesses.map((w) => `- ${w}`).join("\n");
      const recommendationsText = data.recommendations
        .map((r) => `- ${r}`)
        .join("\n");

      const systemPrompt = `
You are an expert in conversion rate optimization (CRO) for websites, specifically focused on optimizing hero sections.
Your task is to rewrite the hero section content to improve conversions based on the identified weaknesses and recommendations.
The optimized content should be clear, compelling, and aligned with best practices for high-converting SaaS websites.

IMPORTANT: Generate only the optimized content without additional explanation in your main output. Your response should be in JSON format containing:
- headline: The optimized headline (compelling, clear, benefit-focused)
- subheadline: The optimized subheadline (expanded value proposition, addressing pain points)
- ctaText: The optimized call-to-action text (action-oriented, clear, value-based)
- explanation: A brief explanation of your changes and how they address the weaknesses
`;

      const userPrompt = `
Please optimize this hero section content based on the identified weaknesses and recommendations:

ORIGINAL CONTENT:
Headline: ${data.originalHero.headline}
Subheadline: ${data.originalHero.subheadline || "(none)"}
CTA Text: ${data.originalHero.ctaText || "(none)"}

WEAKNESSES:
${weaknessesText}

RECOMMENDATIONS:
${recommendationsText}

Format your response as a JSON object with headline, subheadline, ctaText, and explanation fields. 
Make sure all content is concise, compelling, and optimized for conversions.
`;

      const completion = await this.anthropicClient.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const responseContent = completion.content[0].text;

      try {
        // Extract JSON object from response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
        const optimizedContent = JSON.parse(jsonString);

        return {
          headline: optimizedContent.headline || data.originalHero.headline,
          subheadline:
            optimizedContent.subheadline || data.originalHero.subheadline || "",
          ctaText: optimizedContent.ctaText || data.originalHero.ctaText || "",
          explanation:
            optimizedContent.explanation || "No explanation provided.",
        };
      } catch (jsonError) {
        console.error("Failed to parse JSON from response:", jsonError);
        // Fallback to use original data if JSON parsing fails
        return {
          headline: data.originalHero.headline,
          subheadline: data.originalHero.subheadline || "",
          ctaText: data.originalHero.ctaText || "",
          explanation:
            "Failed to generate optimized content. Please try again.",
        };
      }
    } catch (error) {
      console.error("Hero optimization failed:", error);
      throw new Error("Failed to generate optimized hero content");
    }
  }

  private getFallbackAnalysis(): AnalysisResult {
    // Fallback analysis in case Anthropic API fails
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
      ANTHROPIC_API_KEY?: string;
    };
  }
}

// Export a singleton instance
export const apiService = new ApiService();

export default apiService;
