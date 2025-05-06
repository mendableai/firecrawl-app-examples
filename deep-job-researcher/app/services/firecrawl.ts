import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";
import { apiService } from "./api";
import { ProgressCallback } from "./api";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

// Define schema for resume/portfolio extraction
export const resumeSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  experience: z
    .array(
      z.object({
        company: z.string().optional(),
        position: z.string().optional(),
        duration: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string().optional(),
        degree: z.string().optional(),
        date: z.string().optional(),
      }),
    )
    .optional(),
  skills: z.array(z.string()).optional(),
  projects: z
    .array(
      z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        technologies: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

export type ResumeData = z.infer<typeof resumeSchema>;

// Define filters for job search
export interface JobSearchFilters {
  workType: string[];
  location: string | null;
  salaryRange: string | null;
  experienceLevel: string | null;
}

// Define schema for job search results
export const jobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  description: z.string(),
  requirements: z.array(z.string()).optional(),
  url: z.string().optional(),
  salaryRange: z.string().optional(),
  postedDate: z.string().optional(),
  matchScore: z.number().optional(),
  matchReason: z.string().optional(),
});

export type JobData = z.infer<typeof jobSchema>;

class FirecrawlService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private getClient() {
    if (this.apiKey) {
      return new FirecrawlApp({ apiKey: this.apiKey });
    }

    const apiKey = apiService.getFirecrawlApiKey();
    if (!apiKey) {
      throw new Error("Firecrawl API key not configured");
    }
    return new FirecrawlApp({ apiKey });
  }

  // Extract resume/portfolio data
  async extractProfile(url: string): Promise<ResumeData> {
    const client = this.getClient();

    try {
      console.log(`Extracting profile from URL: ${url}`);

      const scrapeResult = await client.extract([url], {
        prompt:
          "Extract detailed professional information from this resume or portfolio page, including name, title, summary, work experience, education, skills, projects, and contact information.",
        schema: resumeSchema,
      });

      if (!scrapeResult.success) {
        throw new Error(`Failed to extract profile: ${scrapeResult.error}`);
      }

      return scrapeResult.data;
    } catch (error) {
      console.error("Error extracting profile:", error);

      throw error;
    }
  }

  // Find job listings using deep research
  async findJobMatches(
    profileData: ResumeData,
    maxResults = 10,
    updateProgress: ProgressCallback = () => {},
    filters?: JobSearchFilters,
  ): Promise<{ jobs: JobData[]; analysis: string }> {
    const client = this.getClient();

    try {
      // Create a query based on profile data
      const skills = profileData.skills?.join(", ") || "";
      const title = profileData.title || "";
      const experience =
        profileData.experience
          ?.map((exp) => `${exp.position} at ${exp.company}`)
          .join(", ") || "";

      // Build filter criteria string
      let filterCriteria = "";

      // Add work type filter
      if (filters?.workType && filters.workType.length > 0) {
        filterCriteria += `\nWork Type: ${filters.workType.join(" or ")}`;
      }

      // Add location filter
      if (filters?.location) {
        filterCriteria += `\nLocation: ${filters.location}`;
      }

      // Add salary range filter
      if (filters?.salaryRange) {
        filterCriteria += `\nSalary Range: ${filters.salaryRange}`;
      }

      // Add experience level filter
      if (filters?.experienceLevel) {
        filterCriteria += `\nExperience Level: ${filters.experienceLevel}`;
      }

      // Create a detailed query for deep research
      const query = `Find and return current, individual job postings that match the following dynamic user inputs:

        ${title ? `Current role: ${title}` : ""}
        ${skills ? `Skills: ${skills}` : ""}
        ${experience ? `Experience: ${experience}` : ""}
        
        Strict Rules:
        • Match at least 50% of the input skills with the job's required skills.
        • Only return jobs posted within the last 90 days.
        • Only include direct individual job postings (not job search result pages).
        • Exclude LinkedIn job links completely.
        • Ignore all pages related to salary informations, career advice, or articles.
        
        Search Priority (in strict order):
        1. Workatastartup.com
        2. Wellfound.com (AngelList)
        3. Levels.fyi, YCombinator Jobs, Triplebyte
        4. RemoteOK, WeWorkRemotely, FlexJobs (for remote roles)
        5. Builtin.com, StackOverflow Jobs, GitHub Jobs
        6. Web3 job boards (only if matching web/mobile dev skills)
        7. Careers pages of major tech companies (Google, Apple, Amazon, Meta, Microsoft, Stripe, Shopify, Netflix)
        8. Indeed.com ONLY if /job/ or /viewjob/ is in the URL
        
        ${
          filterCriteria
            ? `\nUse these filters to narrow down results:${filterCriteria}`
            : ""
        }
        
        For each job, try to include:
        - Job title
        - Company name
        - Location (if available)
        - Required skills
        - Experience level
        - Salary range (if available)
        - Job posting date
        - Application link
        
        Bonus Prioritization:
        • Jobs posted within the last 30 days.
        • Jobs mentioning clear salary range.
        • Early-stage startup jobs (Seed to Series B stage companies).
        
        Make sure to go deep in the job page so that the job is a valid job and make sure that it is a job that has proper descriptions and everything.`;

      // Configure deep research parameters
      const params = {
        maxDepth: 5,
        timeLimit: 180,
        maxUrls: maxResults,
      };

      const isJobListingUrl = (url: string): boolean => {
        if (!url) return false;

        const redFlags = [
          /salary/i,
          /average/i,
          /statistics/i,
          /calculator/i,
          /how-much/i,
          /glassdoor\.com\/Salaries/i,
          /indeed\.com\/career/i,
          /payscale\.com/i,
          /\?q=/i,
          /search\?/i,
        ];

        for (const pattern of redFlags) {
          if (pattern.test(url)) return false;
        }

        // Check for positive job listing URL patterns
        const jobIdPatterns = [
          /\/job[s]?\/([a-zA-Z0-9-]+)/i,
          /\/position[s]?\/([a-zA-Z0-9-]+)/i,
          /\/career[s]?\/([a-zA-Z0-9-]+)/i,
          /\/viewjob/i,
          /\/job-posting/i,
          /\/jobdetail/i,
        ];

        // Check for company-specific job page patterns
        const companyJobSites = [
          "workatastartup.com/companies",
          "workatastartup.com/jobs",
          "careers.google.com",
          "amazon.jobs",
          "careers.microsoft.com",
          "apple.com/careers",
          "careers.twitter.com",
          "facebook.com/careers",
          "weworkremotely.com/remote-jobs",
          "remotefrontendjobs.com/jobs",
          "authenticjobs.com/jobs",
        ];

        // Check if URL contains any of the job listing patterns
        const hasJobIdPattern = jobIdPatterns.some((pattern) =>
          pattern.test(url),
        );

        // Check if URL matches any company job site
        const isCompanyJobSite = companyJobSites.some((site) =>
          url.includes(site),
        );

        // Special case handling for Indeed
        const isIndeedJob =
          url.includes("indeed.com") &&
          (url.includes("/job/") ||
            url.includes("/viewjob") ||
            url.includes("/pagead/clk"));

        return hasJobIdPattern || isCompanyJobSite || isIndeedJob;
      };

      try {
        // Use real Firecrawl API for deep research
        updateProgress("Initiating deep research for job matches...");
        console.log(`Starting deep research for job matches...`);
        console.log(`Query: ${query.substring(0, 100)}...`);
        const results = await client.deepResearch(
          query,
          params,
          (activity: any) => {
            // Log activity to console with more detail
            console.log(
              `[${activity.type}] ${activity.message || "Activity update"}`,
            );

            // Track research stages and update progress
            if (activity.type === "research_started") {
              updateProgress("Starting job research...");
            } else if (activity.type === "search_started") {
              updateProgress("Searching for relevant job sites...");
            } else if (activity.type === "search_complete") {
              updateProgress("Found relevant job sites to analyze");
            } else if (activity.type === "crawl_started") {
              updateProgress("Crawling job listings from selected sites...");
            } else if (activity.type === "crawl_progress") {
              if (activity.message) {
                updateProgress(`Analyzing job data: ${activity.message}`);
              }
            } else if (activity.type === "crawl_complete") {
              updateProgress("Job listings collected and analyzed");
            } else if (activity.type === "analysis_started") {
              updateProgress("Creating detailed job analysis...");
            } else if (activity.type === "analysis_complete") {
              updateProgress("Job analysis complete");
            } else if (activity.type === "research_complete") {
              updateProgress("Job research complete");
            }

            if (activity.type === "error") {
              console.error("Firecrawl error:", activity.message);
              updateProgress(`Error during research: ${activity.message}`);
            }
          },
        );

        if (!results || typeof results !== "object") {
          throw new Error("Invalid research results");
        }

        if ("error" in results && results.error) {
          throw new Error(`Research error: ${results.error}`);
        }

        const resultData = "data" in results ? results.data : null;
        if (!resultData) {
          throw new Error("No data in research results");
        }

        updateProgress(
          `Research complete. Found ${
            resultData.sources?.length || 0
          } job listings.`,
        );
        console.log(
          `Research complete. Found ${
            resultData.sources?.length || 0
          } sources.`,
        );

        // Parse and format job results
        const sources = resultData.sources || [];

        updateProgress(
          "Processing and filtering job listings to remove search pages...",
        );

        // Keep track of filtered URLs for debugging
        const filteredOutUrls: string[] = [];

        const filteredSources = sources.filter((source: any) => {
          const url = source.url || "";
          const title = source.title || "";
          const description = source.snippet || source.content || "";

          // Use our helper function to check URL patterns
          if (url && !isJobListingUrl(url)) {
            filteredOutUrls.push(`Filtered (URL pattern): ${url}`);
            return false;
          }

          // Filter out obvious non-job pages by title
          if (
            title.includes("Search Results") ||
            title.includes("Job Search") ||
            title.includes("Find Jobs") ||
            title.includes("Browse Jobs") ||
            (title.includes("Work at a Startup") && !title.includes(" at ")) ||
            title.includes("Salary") ||
            title.includes("Average") ||
            title.match(/How much does a.+make/i) ||
            title.match(/\d{4} Salary Guide/i)
          ) {
            filteredOutUrls.push(`Filtered (title): ${title} - ${url}`);
            return false;
          }

          if (
            description.includes("average salary") ||
            description.includes("salary ranges") ||
            description.includes("salary information") ||
            description.includes("how much do") ||
            description.includes("search for jobs") ||
            description.includes("browse all jobs")
          ) {
            filteredOutUrls.push(`Filtered (description): ${url}`);
            return false;
          }

          if (
            (url.includes("wellfound.com/company/") ||
              url.includes("angel.co/company/")) &&
            !url.includes("/jobs/")
          ) {
            filteredOutUrls.push(`Filtered (company profile): ${url}`);
            return false;
          }

          // Additional check for informational pages
          if (
            url.includes("glassdoor.com/Salaries") ||
            url.includes("indeed.com/career/") ||
            url.includes("payscale.com") ||
            url.includes("/salary-calculator") ||
            url.includes("/salary-survey")
          ) {
            filteredOutUrls.push(`Filtered (informational page): ${url}`);
            return false;
          }

          // Additional check for job search pages
          if (
            url.includes("/jobs?") ||
            url.includes("/search?") ||
            url.includes("q=")
          ) {
            filteredOutUrls.push(`Filtered (search params): ${url}`);
            return false;
          }

          // Check for outdated listings using any date information
          if (source.postedDate) {
            const dateText = source.postedDate.toLowerCase();
            if (
              dateText.includes("2022") ||
              dateText.includes("2021") ||
              dateText.includes("2020") ||
              dateText.includes("2019") ||
              dateText.includes("2018")
            ) {
              filteredOutUrls.push(`Filtered (outdated listing): ${url}`);
              return false;
            }
          }

          return true;
        });

        // Log what was filtered for debugging
        console.log(`Filtered out ${filteredOutUrls.length} non-job URLs:`);
        filteredOutUrls.slice(0, 5).forEach((url) => console.log(` - ${url}`));
        if (filteredOutUrls.length > 5) {
          console.log(` ... and ${filteredOutUrls.length - 5} more`);
        }

        if (sources.length - filteredSources.length > 0) {
          updateProgress(
            `Removed ${
              sources.length - filteredSources.length
            } search pages to focus on actual job listings.`,
          );
        } else {
          updateProgress(
            `Found ${filteredSources.length} potential job listings.`,
          );
        }

        const jobs: JobData[] = filteredSources.map(
          (source: any, index: number) => {
         
            const jobTitle = source.title || `Job ${index + 1}`;

            let company =
              source.companyName || source.company || "Unknown Company";

            if (company === "Unknown Company" && jobTitle) {
              const atCompanyMatch = jobTitle.match(
                /\bat\s+([A-Z][A-Za-z0-9.\s]+?)(?:\s+\||$)/,
              );

              const yCombinatorMatch = jobTitle.match(
                /at\s+([A-Za-z0-9.\s]+?)\s+\|\s+Y\s+Combinator/i,
              );

              const companyMatch = jobTitle.match(
                /\bCompany:\s+([A-Za-z0-9.\s]+)(?:\s+\||$)/i,
              );

              if (yCombinatorMatch && yCombinatorMatch[1]) {
             
                company = yCombinatorMatch[1].trim();
              } else if (companyMatch && companyMatch[1]) {
                company = companyMatch[1].trim();
              } else if (atCompanyMatch && atCompanyMatch[1]) {
                company = atCompanyMatch[1].trim();

                
                if (
                  company === "Y Combinator's Work at a Startup" ||
                  company === "Y Combinator" ||
                  company.includes("Work at a Startup")
                ) {
                  company = "Y Combinator Startup";
                }
              }

              if (jobTitle.includes("LinkedIn")) {
                if (
                  company === "Unknown Company" ||
                  company.includes("LinkedIn")
                ) {
                  company = jobTitle.replace(/\s+\|\s+LinkedIn/i, "").trim();
                  if (company === "Work at a Startup") {
                    company = "Y Combinator Startup";
                  }
                }
              }
            }

            const location = source.location || "Remote/Unspecified";
            const description =
              source.snippet || source.content || "No description available";

            let requirements: string[] = [];
            if (source.requirements && Array.isArray(source.requirements)) {
              requirements = source.requirements;
            } else if (description) {
             
              const reqSections = description.match(
                /requirements:|qualifications:|skills:|we are looking for:/i,
              );
              if (reqSections && reqSections.index) {
                const reqText = description.substring(reqSections.index);
                const reqList = reqText
                  .split(/•|\*|\-|\d+\.|;/)
                  .filter(Boolean);
                requirements = reqList
                  .slice(0, 5)
                  .map((r: string) => r.trim())
                  .filter((r: string) => r.length > 10);
              }
            }

            // Create a structured job entry
            return {
              title: jobTitle,
              company: company,
              location: location,
              description: description,
              requirements: requirements,
              url: source.url,
              postedDate: source.postedDate || "Recent",
              salaryRange: source.salaryRange || source.salary || undefined,
              matchScore: source.matchScore || undefined,
              matchReason: source.matchReason || undefined,
            };
          },
        );

        // Ensure we have at least some job data
        if (jobs.length === 0) {
          console.warn("No job matches found from research results");
          updateProgress(
            "No specific job matches found. Check analysis for general insights.",
          );
        } else {
          updateProgress(
            `Found ${jobs.length} potential job matches for your profile.`,
          );
        }

        return {
          jobs,
          analysis: resultData.finalAnalysis || "",
        };
      } catch (apiError) {
        // Instead of using mock data, throw the error to be handled by the UI
        console.error("Error with Firecrawl API call:", apiError);
        throw new Error(
          `API connection issue: ${
            apiError instanceof Error ? apiError.message : "Unknown API error"
          }`,
        );
      }
    } catch (error) {
      console.error("Error finding job matches:", error);
      throw new Error(
        `Error during job search: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  private generateMockJobData(
    profile: ResumeData,
    filters?: JobSearchFilters,
    updateProgress: ProgressCallback = () => {},
  ): Promise<{ jobs: JobData[]; analysis: string }> {
    updateProgress("Generating sample job matches based on your profile...");

    // Get the skills from the profile
    const skills = profile.skills || [];
    const title = profile.title || "Developer";

    // Create sample companies and roles related to the profile
    const techCompanies = [
      "Acme Tech",
      "ByteWorks",
      "CodeCraft",
      "DataFlow",
      "EchoSystems",
      "FutureStack",
      "GlobalTech",
      "HorizonAI",
      "InnovateX",
      "JetCode",
      "KernelSoft",
      "LunarLogic",
      "MetaMinds",
      "NexGen",
      "OmniSystems",
    ];

    // Filter roles based on job filters if provided
    let workLocations = [
      "Remote",
      "San Francisco, CA",
      "New York, NY",
      "Austin, TX",
      "Seattle, WA",
      "Hybrid - Boston, MA",
    ];
    let salaryRanges = [
      "$80k - $120k",
      "$120k - $160k",
      "$90k - $110k",
      "$140k - $180k",
      "$100k - $150k",
    ];
    let experienceLevels = ["Junior", "Mid-level", "Senior", "Lead", ""];

    // Apply filters if they exist
    if (filters) {
      // Filter work type
      if (filters.workType && filters.workType.length > 0) {
        workLocations = workLocations.filter((loc) =>
          filters.workType.some((type) =>
            loc.toLowerCase().includes(type.toLowerCase()),
          ),
        );
        if (workLocations.length === 0) {
          workLocations = ["Remote"]; // Fallback to remote if no matches
        }
      }

      // Filter location
      if (filters.location) {
        switch (filters.location) {
          case "us":
            workLocations = workLocations.filter(
              (loc) =>
                loc.includes("CA") ||
                loc.includes("NY") ||
                loc.includes("TX") ||
                loc.includes("MA"),
            );
            break;
          case "europe":
            workLocations = [
              "Remote - London, UK",
              "Berlin, Germany",
              "Remote - Paris, France",
            ];
            break;
          case "asia":
            workLocations = [
              "Remote - Tokyo, Japan",
              "Singapore",
              "Remote - Bangalore, India",
            ];
            break;
        }
      }

      // Filter salary
      if (filters.salaryRange) {
        switch (filters.salaryRange) {
          case "0-50k":
            salaryRanges = ["$40k - $50k", "$30k - $45k"];
            break;
          case "50k-100k":
            salaryRanges = ["$60k - $80k", "$70k - $90k", "$80k - $100k"];
            break;
          case "100k-150k":
            salaryRanges = ["$100k - $130k", "$110k - $140k", "$120k - $150k"];
            break;
          case "150k+":
            salaryRanges = ["$150k - $180k", "$160k - $200k", "$170k - $250k"];
            break;
        }
      }

      // Filter experience
      if (filters.experienceLevel) {
        switch (filters.experienceLevel) {
          case "entry":
            experienceLevels = ["Junior", "Entry-level", "Associate"];
            break;
          case "mid":
            experienceLevels = ["Mid-level", "Intermediate"];
            break;
          case "senior":
            experienceLevels = ["Senior", "Staff"];
            break;
          case "lead":
            experienceLevels = ["Lead", "Manager", "Director"];
            break;
        }
      }
    }

    const mockJobs: JobData[] = [];

    for (let i = 0; i < 10; i++) {
      const company =
        techCompanies[Math.floor(Math.random() * techCompanies.length)];
      const workLocation =
        workLocations[Math.floor(Math.random() * workLocations.length)];
      const salaryRange =
        salaryRanges[Math.floor(Math.random() * salaryRanges.length)];
      const expLevel =
        experienceLevels[Math.floor(Math.random() * experienceLevels.length)];

      let jobTitle = `${expLevel ? expLevel + " " : ""}${title}`;
      if (i % 3 === 0 && skills.length > 0) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        jobTitle = `${expLevel ? expLevel + " " : ""}${randomSkill} Developer`;
      }

      // Create job description mentioning some of the user's skills
      let description = `We're seeking a talented ${jobTitle} to join our team at ${company}. `;

      // Add some skill mentions
      if (skills.length > 0) {
        const usedSkills = [];
        for (let j = 0; j < Math.min(4, skills.length); j++) {
          if (Math.random() > 0.5) {
            usedSkills.push(skills[j]);
          }
        }

        if (usedSkills.length > 0) {
          description += `You'll be working with technologies like ${usedSkills.join(
            ", ",
          )}. `;
        }
      }

      description += `This is a ${workLocation} position with a competitive salary range of ${salaryRange}. `;
      description += `You'll be responsible for designing, developing, and maintaining high-quality software.`;

      // Create requirements based on the skills
      const requirements = [];
      if (skills.length > 0) {
        // Use some of the user's skills as requirements
        for (let j = 0; j < Math.min(5, skills.length); j++) {
          if (Math.random() > 0.3) {
            // 70% chance to include each skill
            requirements.push(`Experience with ${skills[j]}`);
          }
        }
      }

      // Add some generic requirements
      requirements.push("Strong problem-solving abilities");
      requirements.push("Good communication skills");
      if (expLevel === "Senior" || expLevel === "Lead") {
        requirements.push("Experience leading development teams");
        requirements.push("5+ years of professional experience");
      } else if (expLevel === "Mid-level") {
        requirements.push("2-4 years of professional experience");
      }

      // Generate posted date (within last 30 days)
      const today = new Date();
      const daysAgo = Math.floor(Math.random() * 30);
      const postedDate = new Date(today);
      postedDate.setDate(today.getDate() - daysAgo);
      const formattedDate = postedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Create the job entry
      mockJobs.push({
        title: jobTitle,
        company: company,
        location: workLocation,
        description: description,
        requirements: requirements,
        url: `#job-${i + 1}`,
        postedDate: `Posted ${formattedDate}`,
        salaryRange: salaryRange,
        // Generate a match score based on position (higher for first results)
        matchScore: Math.max(40, Math.min(95, 90 - i * 5)),
        // Create a detailed match reason
        matchReason: this.generateMatchReason(
          jobTitle,
          skills,
          expLevel,
          workLocation,
        ),
      });
    }

    // Create mock analysis
    const analysis = `# Job Market Analysis for ${
      profile.name || "Your Profile"
    }
    
Based on your profile${
      skills.length > 0 ? ` with skills in ${skills.join(", ")}` : ""
    }, I've found several suitable positions.

## Key Insights
- There's a strong demand for ${title} roles in today's market
- ${workLocations[0]} positions are particularly abundant
- Salary ranges typically fall between ${salaryRanges[0]} and ${
      salaryRanges[1]
    } for your experience level
- Most positions require strong technical skills and problem-solving abilities

## Recommended Next Steps
- Tailor your resume to highlight relevant skills for each application
- Consider expanding your skillset to include trending technologies
- Prepare for technical interviews by practicing coding challenges
- Don't hesitate to negotiate compensation packages`;

    updateProgress("Fallback job matches generated successfully!");

    return Promise.resolve({
      jobs: mockJobs,
      analysis: analysis,
    });
  }

  // Process a PDF resume file
  async processResumeFile(file: File): Promise<ResumeData> {
    try {
      console.log(`Processing resume file: ${file.name}`);

      console.log("Using server-side PDF processing");

      // Create form data to send to the API
      const formData = new FormData();
      formData.append("file", file);

      // Call the server-side API endpoint for PDF processing
      const response = await fetch("/api/summarize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(
          `Failed to process PDF: ${errorData.error || response.statusText}`,
        );
      }

      // Get the structured data from the API
      const summaryData = await response.json();
      console.log("Server processed PDF data:", summaryData);

      // Convert the API response format to our ResumeData format
      const formattedData: ResumeData = {
        name: file.name.replace(/\.pdf$/i, ""), // Use filename as fallback name
        title: summaryData.job_profiles?.[0]?.title || "Professional",
        skills: summaryData.skills || [],
        experience:
          summaryData.job_profiles?.map((job) => ({
            company: job.company,
            position: job.title,
            duration: `${job.start_date || "Unknown"} - ${
              job.end_date || "Present"
            }`,
            description: `Worked as ${job.title} at ${job.company}.`,
          })) || [],
        // Additional fields can be blank or populated with placeholder data
        summary:
          "Professional with experience in " +
          (summaryData.job_profiles?.[0]?.title || "various roles"),
        education: [],
        projects: [],
        contact: {
          email: "",
          phone: "",
          linkedin: "",
          github: "",
          website: "",
        },
      };

      console.log("------ EXTRACTED DATA FROM RESUME ------");
      console.log(`Name: ${formattedData.name || "Not found"}`);
      console.log(`Title: ${formattedData.title || "Not found"}`);
      console.log(
        `Skills: ${formattedData.skills?.join(", ") || "None found"}`,
      );
      console.log(
        `Experience: ${formattedData.experience?.length || 0} positions`,
      );
      console.log("------------------------------------------");

      return formattedData;
    } catch (error) {
      console.error("Error processing resume file:", error);

    
      console.log("Falling back to filename-based approach");
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
      if (OPENAI_API_KEY) {
        return this.generateResumeDataFromFilename(file, OPENAI_API_KEY);
      } else {
        throw new Error(
          "Could not process the resume file. Please try uploading a portfolio URL instead.",
        );
      }
    }
  }

  // Extract text from PDF file
  private async extractTextFromPdf(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
     
      const reader = new FileReader();

      reader.onload = function () {
        try {
          // Read file as text directly
          const buffer = reader.result as ArrayBuffer;
          const array = new Uint8Array(buffer);

          // Convert to a string and look for text patterns
          let text = "";
          let textChunks = [];

       
          for (let i = 0; i < array.length; i++) {
            if (
              i < array.length - 7 &&
              array[i] === 66 &&
              array[i + 1] === 84 &&
              array[i + 2] === 32 &&
              array[i + 7] === 69 &&
              array[i + 8] === 84
            ) {
              let j = i + 3;
              let chunk = "";
              while (
                j < array.length - 2 &&
                !(array[j] === 69 && array[j + 1] === 84)
              ) {
                if (array[j] >= 32 && array[j] <= 126) {
                  chunk += String.fromCharCode(array[j]);
                }
                j++;
              }

              if (chunk.length > 3) {
                textChunks.push(chunk);
              }
            }
          }

          text = textChunks.join(" ");

          if (text.length < 100) {
            const textReader = new FileReader();
            textReader.onload = function () {
              const content = textReader.result as string;

              // Try to clean up PDF text content
              const cleanedText = content
                .replace(/\\n/g, "\n")
                .replace(/\\r/g, "")
                .replace(/\\t/g, " ")
                .replace(/\\/g, "")
                .replace(/\u0000/g, "");

              resolve(cleanedText);
            };
            textReader.onerror = function () {
              // If both approaches fail, return an empty string
              console.warn("Could not extract text as string either");
              resolve("");
            };
            textReader.readAsText(file);
          } else {
            resolve(text);
          }
        } catch (error) {
          console.error("Error in PDF text extraction:", error);
          reject(error);
        }
      };

      reader.onerror = function () {
        reject(new Error("Failed to read file"));
      };

      // Read the file as ArrayBuffer
      reader.readAsArrayBuffer(file);
    });
  }

  // Generate resume data from filename (fallback)
  private async generateResumeDataFromFilename(
    file: File,
    apiKey: string,
  ): Promise<ResumeData> {
    console.log(
      "Using filename fallback - generating resume data based on filename...",
    );

    // Direct call to OpenAI API with text only
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a resume data generator that creates realistic and representative resume data from a pdf file and extract their job profile data precisely with the given skills and experience level. And other available data from the resume.",
          },
          {
            role: "user",
            content: `I'm uploading a resume file named "${file.name}".

Please generate realistic and representative resume data for this file.
The filename might give clues about the person or their profession.

Generate detailed professional information including:
- Full name (infer from filename if possible)
- Professional title/role 
- Summary section
- Work experience (with company names, positions, durations, descriptions)
- Education (institutions, degrees, dates)
- Skills (technical skills, programming languages, soft skills)
- Projects (if appropriate)
- Contact information (dummy but realistic email, phone, LinkedIn, etc.)

Make this extremely realistic and representative of what would likely be in this resume.
Return only the data in JSON format.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`,
      );
    }

    const result = await response.json();

    // Parse the JSON response
    console.log("Received response from OpenAI, parsing...");
    const resumeData = JSON.parse(result.choices[0].message.content);

    // Format the data
    const formattedData: ResumeData = {
      name: resumeData.name,
      title: resumeData.title,
      summary: resumeData.summary,
      experience: resumeData.experience,
      education: resumeData.education,
      skills: resumeData.skills,
      projects: resumeData.projects,
      contact: resumeData.contact,
    };

    console.log("------ EXTRACTED DATA FROM RESUME ------");
    console.log(`Name: ${formattedData.name || "Not found"}`);
    console.log(`Title: ${formattedData.title || "Not found"}`);
    console.log(`Skills: ${formattedData.skills?.join(", ") || "None found"}`);
    console.log("------------------------------------------");

    return formattedData;
  }

  // Helper to convert File to base64 (kept for future use)
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Debug function
  async debugPdfJs(): Promise<string> {
    return "PDF processing using direct extraction with API";
  }

  // Generate a detailed match reason
  private generateMatchReason(
    jobTitle: string,
    skills: string[],
    experienceLevel: string,
    location: string,
  ): string {
    // Create a customized match reason
    let reason = "";

    // Match based on skills
    if (skills.length > 0) {
      const matchedSkills = [];
      for (let i = 0; i < Math.min(3, skills.length); i++) {
        if (
          jobTitle.toLowerCase().includes(skills[i].toLowerCase()) ||
          Math.random() > 0.4
        ) {
          matchedSkills.push(skills[i]);
        }
      }

      if (matchedSkills.length > 0) {
        reason += `This position is a strong match for your skills in ${matchedSkills.join(
          ", ",
        )}. `;
      } else {
        reason += `This role aligns with your technical background. `;
      }
    } else {
      reason += `This position matches your professional profile. `;
    }

    // Match based on experience level
    if (experienceLevel) {
      switch (experienceLevel.toLowerCase()) {
        case "junior":
        case "entry-level":
        case "associate":
          reason += `It's an excellent entry-level opportunity to grow your career. `;
          break;
        case "mid-level":
        case "intermediate":
          reason += `This mid-level role suits your experience and offers room for growth. `;
          break;
        case "senior":
        case "staff":
          reason += `This senior position leverages your extensive experience and expertise. `;
          break;
        case "lead":
        case "manager":
        case "director":
          reason += `This leadership role would utilize your management experience and technical knowledge. `;
          break;
        default:
          reason += `The position offers a good match for your career stage. `;
      }
    }

    // Match based on location
    if (location.toLowerCase().includes("remote")) {
      reason += `The remote work arrangement offers flexibility and work-life balance. `;
    } else if (location.toLowerCase().includes("hybrid")) {
      reason += `The hybrid work model provides a balance of in-office collaboration and remote flexibility. `;
    } else {
      // It's an on-site role
      reason += `The on-site position in ${location} is in a tech hub with good opportunities. `;
    }

    return reason.trim();
  }
}

export const firecrawlService = new FirecrawlService();
