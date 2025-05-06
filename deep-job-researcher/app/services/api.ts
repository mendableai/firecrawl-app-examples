import {
  firecrawlService,
  ResumeData,
  JobData,
  JobSearchFilters,
} from "./firecrawl";

// Progress update callback type
export type ProgressCallback = (message: string) => void;

class ApiService {
  private FIRECRAWL_API_KEY_STORAGE_KEY = "firecrawl-api-key";

  // Set the Firecrawl API key in local storage
  setFirecrawlApiKey(key: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.FIRECRAWL_API_KEY_STORAGE_KEY, key);
      // Also set the key in the firecrawl service
      firecrawlService.setApiKey(key);
    }
  }

  // Get the Firecrawl API key from local storage
  getFirecrawlApiKey(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(this.FIRECRAWL_API_KEY_STORAGE_KEY);
    }
    return null;
  }

  // Clear the Firecrawl API key from local storage
  clearFirecrawlApiKey(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.FIRECRAWL_API_KEY_STORAGE_KEY);
  }

  // Process a profile URL and find matching jobs
  async analyzeProfileUrl(
    url: string,
    updateProgress: ProgressCallback = () => {},
    initialFilters?: JobSearchFilters,
  ): Promise<{
    profile: ResumeData;
    jobs: JobData[];
    analysis: string;
  }> {
    if (!url) {
      throw new Error("URL is required");
    }

    try {
      // Extract profile data from URL
      updateProgress("Extracting profile information...");
      const profile = await firecrawlService.extractProfile(url);

      // Find job matches based on profile
      updateProgress("Finding job matches based on your profile...");
      if (
        initialFilters &&
        (initialFilters.workType.length > 0 ||
          initialFilters.location ||
          initialFilters.salaryRange ||
          initialFilters.experienceLevel)
      ) {
        updateProgress("Applying your job filters to the search...");
      }

      const { jobs, analysis } = await firecrawlService.findJobMatches(
        profile,
        10,
        updateProgress,
        initialFilters, 
      );

      // Match jobs to the profile using server-side API
      updateProgress("Calculating match scores for job listings...");
      const matchedJobs = await this.matchJobsWithProfile(
        profile,
        jobs,
        analysis,
        updateProgress,
      );

      return { profile, jobs: matchedJobs, analysis };
    } catch (error) {
      console.error("API service error:", error);
      throw error;
    }
  }

  // Process a resume file and find matching jobs
  async analyzeResumeFile(
    file: File,
    updateProgress: ProgressCallback = () => {},
    initialFilters?: JobSearchFilters,
  ): Promise<{
    profile: ResumeData;
    jobs: JobData[];
    analysis: string;
  }> {
    if (!file) {
      throw new Error("Resume file is required");
    }

    try {
      updateProgress("Processing your resume...");
      const profile = await firecrawlService.processResumeFile(file);

      // Find job matches based on extracted profile
      updateProgress("Finding job matches based on your resume...");
      if (
        initialFilters &&
        (initialFilters.workType.length > 0 ||
          initialFilters.location ||
          initialFilters.salaryRange ||
          initialFilters.experienceLevel)
      ) {
        updateProgress("Applying your job filters to the search...");
      }

      const { jobs, analysis } = await firecrawlService.findJobMatches(
        profile,
        10,
        updateProgress,
        initialFilters, // Pass initial filters if provided
      );

      // Match jobs to the profile using server-side API
      updateProgress("Calculating match scores for job listings...");
      const matchedJobs = await this.matchJobsWithProfile(
        profile,
        jobs,
        analysis,
        updateProgress,
      );

      return { profile, jobs: matchedJobs, analysis };
    } catch (error) {
      console.error("API service error:", error);
      throw error;
    }
  }

  // Helper method to match jobs using the server-side API
  private async matchJobsWithProfile(
    profile: ResumeData,
    jobs: JobData[],
    analysis: string,
    updateProgress: ProgressCallback = () => {},
  ): Promise<JobData[]> {
    try {
    
      if (jobs.length > 0 && jobs[0].matchScore) {
        updateProgress("Using existing job match scores");
        return jobs;
      }

      // Call the server-side API route for matching
      updateProgress("Sending data to OpenAI for advanced matching...");
      const response = await fetch("/api/match-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profile, jobs, analysis }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      updateProgress("Received and processing job match results");
      const result = await response.json();
      return result.jobs;
    } catch (error) {
      console.error("Error matching jobs with profile:", error);

      throw new Error(
        `Failed to match jobs with profile: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  // Method to handle job filtering with filters
  async findJobsWithFilters(
    profile: ResumeData,
    filters: JobSearchFilters,
    updateProgress: ProgressCallback = () => {},
  ): Promise<{ jobs: JobData[]; analysis: string }> {
    if (!profile) {
      throw new Error("Profile data is required for job matching");
    }

    updateProgress("Starting job search with filters...");

    // Call the findJobMatches method with filters
    const results = await firecrawlService.findJobMatches(
      profile,
      10, // maxResults
      updateProgress,
      filters,
    );

    // Match jobs to the profile using server-side API
    updateProgress("Calculating match scores for filtered job listings...");
    const matchedJobs = await this.matchJobsWithProfile(
      profile,
      results.jobs,
      results.analysis,
      updateProgress,
    );

    return {
      jobs: matchedJobs,
      analysis: results.analysis,
    };
  }

  // Debug function to test PDF.js worker configuration
  async debugPdfJs(): Promise<string> {
    return firecrawlService.debugPdfJs();
  }
}

export const apiService = new ApiService();
