import FirecrawlApp from "@mendable/firecrawl-js";

class ApiService {
  private firecrawlApiKey: string | null = null;
  private firecrawlClient: FirecrawlApp | null = null;

  constructor() {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const storedFirecrawlKey = localStorage.getItem("firecrawl_api_key");
      this.firecrawlApiKey = storedFirecrawlKey || null;

      // Initialize client if key is available
      this.initializeClient();
    }
  }

  private initializeClient() {
    if (this.firecrawlApiKey) {
      this.firecrawlClient = new FirecrawlApp({
        apiKey: this.firecrawlApiKey.startsWith("fc-")
          ? this.firecrawlApiKey
          : `fc-${this.firecrawlApiKey}`,
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

  getFirecrawlClient(): FirecrawlApp | null {
    return this.firecrawlClient;
  }

  hasFirecrawlApiKey(): boolean {
    return !!this.firecrawlApiKey;
  }
}

const apiService = new ApiService();
export default apiService;
