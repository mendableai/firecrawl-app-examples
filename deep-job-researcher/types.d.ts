// Type declarations for missing modules

declare module "firecrawl" {
  export interface ScrapeResult {
    success: boolean;
    error?: string;
    data: any;
  }

  export interface CrawlResult {
    success: boolean;
    error?: string;
    data: any;
  }

  export class FirecrawlClient {
    constructor(options: { apiKey: string });
  }
}

declare module "uuid" {
  export function v4(): string;
}

declare module "@mozilla/readability" {
  export class Readability {
    constructor(document: any);
    parse(): any;
  }
}

declare module "jsdom" {
  export class JSDOM {
    constructor(html: string);
    window: any;
  }
}

declare module "../utils/profileExtractor" {
  export function extractProfileData(html: string): any;
}

declare module "../utils/resumeParser" {
  export function parseResume(text: string): any;
}

declare module "../types/job" {
  export interface JobDetailedData {
    title: string;
    company: string;
    location?: string;
    description: string;
    requirements?: string[];
    url?: string;
    salaryRange?: string;
    postedDate?: string;
    matchScore?: number;
    matchReason?: string;
  }

  export interface JobSearchFilters {
    workType: string[];
    location: string | null;
    salaryRange: string | null;
    experienceLevel: string | null;
  }
}
