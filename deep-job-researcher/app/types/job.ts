/**
 * Job Types
 */

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
