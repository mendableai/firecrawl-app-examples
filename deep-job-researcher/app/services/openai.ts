import OpenAI from "openai";
import { ResumeData, JobData } from "./firecrawl";

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }

  async matchJobsToProfile(
    profile: ResumeData,
    jobs: JobData[],
    analysisText: string,
  ): Promise<JobData[]> {
    console.log("Matching jobs to profile based on skills and experience");

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    if (jobs.length > 0 && jobs[0].matchScore) {
      return jobs;
    }

    const userSkills = profile.skills?.join(", ") || "";
    const userExperience =
      profile.experience
        ?.map((exp) => `${exp.position} at ${exp.company}`)
        .join(", ") || "";
    const userEducation =
      profile.education
        ?.map((edu) => `${edu.degree} from ${edu.institution}`)
        .join(", ") || "";

    const profileSummary = `
      Name: ${profile.name || "Unknown"}
      Title: ${profile.title || "Unknown"}
      Skills: ${userSkills}
      Experience: ${userExperience}
      Education: ${userEducation}
      Summary: ${profile.summary || ""}
    `;

    const jobsData = jobs.map((job) => {
      return {
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements?.join(", ") || "",
        url: job.url || "",
      };
    });

    try {
      const response = await this.client.chat.completions.create({
        model: "o3",
        messages: [
          {
            role: "system",
            content: `You are a job matching expert. Your task is to match a candidate's profile with job listings and rank them by relevance. For each job, provide a match score (0-100) and a brief explanation of why the job is a good match.`,
          },
          {
            role: "user",
            content: `
              I need to match this candidate profile with job listings:
              
              CANDIDATE PROFILE:
              ${profileSummary}
              
              JOB LISTINGS (in JSON format):
              ${JSON.stringify(jobsData, null, 2)}
              
              ADDITIONAL ANALYSIS:
              ${analysisText}
              
              For each job, provide:
              1. A match score from 0-100
              2. A brief explanation of why this job matches or doesn't match the candidate
              
              Return the results as a JSON array with each job having the original fields plus 'matchScore' and 'matchReason' fields.
            `,
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message.content || "{}";
      const matchedJobs = JSON.parse(content);

      if (Array.isArray(matchedJobs.jobs)) {
        return matchedJobs.jobs
          .map((matchedJob: any) => {
            const originalJob = jobs.find(
              (job) =>
                job.title === matchedJob.title &&
                job.company === matchedJob.company,
            );
            if (originalJob) {
              return {
                ...originalJob,
                matchScore: matchedJob.matchScore || 0,
                matchReason: matchedJob.matchReason || "",
              };
            }
            return null;
          })
          .filter(Boolean)
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }

      // If response format is unexpected, throw an error
      throw new Error("Unexpected response format from OpenAI API");
    } catch (error) {
      console.error("Error matching jobs:", error);
      throw error; 
    }
  }
}

export const openaiService = new OpenAIService();
