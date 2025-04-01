import dotenv from "dotenv";

dotenv.config();

export async function getCronSources(): Promise<{ identifier: string }[]> {
  try {
    console.log("Fetching sources...");

    // Check for required API keys
    const hasXApiKey = !!process.env.X_API_BEARER_TOKEN;
    const hasFirecrawlKey = !!process.env.FIRECRAWL_API_KEY;

    // Define sources based on available API keys
    const sources: { identifier: string }[] = [
      ...(hasFirecrawlKey
        ? [
            { identifier: "https://www.firecrawl.dev/blog" },
            { identifier: "https://openai.com/news/" },
            { identifier: "https://www.anthropic.com/news" },
            { identifier: "https://news.ycombinator.com/" },
            {
              identifier:
                "https://www.reuters.com/technology/artificial-intelligence/",
            },
            { identifier: "https://simonwillison.net/" },
            { identifier: "https://buttondown.com/ainews/archive/" },
          ]
        : []),
      ...(hasXApiKey ? [{ identifier: "https://x.com/skirano" }] : []),
    ];

    // Return the full objects instead of mapping to strings
    return sources;
  } catch (error) {
    console.error(error);
    return [];
  }
}