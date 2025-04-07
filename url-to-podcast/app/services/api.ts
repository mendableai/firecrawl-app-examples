
class ApiService {
  private FIRECRAWL_API_KEY_STORAGE_KEY = "firecrawl-api-key";

  // Fetch the Firecrawl API key from local storage
  getFirecrawlApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.FIRECRAWL_API_KEY_STORAGE_KEY);
  }

  // Store the Firecrawl API key in local storage
  setFirecrawlApiKey(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.FIRECRAWL_API_KEY_STORAGE_KEY, key);
  }

  // Clear the Firecrawl API key from local storage
  clearFirecrawlApiKey(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.FIRECRAWL_API_KEY_STORAGE_KEY);
  }
}

export const apiService = new ApiService();
