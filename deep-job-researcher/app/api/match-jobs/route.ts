import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ResumeData, JobData } from "../../services/firecrawl";

// This runs on the server side only
export async function POST(request: Request) {
  try {
    const { profile, jobs, analysis } = await request.json();

    // Check if we have jobs to process
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: "No jobs provided for matching" },
        { status: 400 },
      );
    }

    // If jobs already have match scores, just return them
    if (jobs.length > 0 && jobs[0].matchScore) {
      return NextResponse.json({ jobs });
    }

    // Use environment variable for API key (safer on server side)
    const apiKey = process.env.OPENAI_API_KEY;

    // In development/without an API key, return simulated scoring
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      console.log("Using automatic job matching (no API key configured)");

      // Attempt to do basic matching based on skills and job requirements
      const matchedJobs = jobs.map((job: JobData, index: number) => {
        const userSkills = profile.skills || [];
        const jobKeywords = [
          ...(job.requirements || []),
          job.title.toLowerCase(),
          job.description.toLowerCase(),
        ];

        // Count how many user skills appear in the job description/requirements
        let matchCount = 0;
        let matchedSkills: string[] = [];

        userSkills.forEach((skill: string) => {
          const lowerSkill = skill.toLowerCase();
          if (
            jobKeywords.some((keyword) =>
              keyword.toLowerCase().includes(lowerSkill),
            )
          ) {
            matchCount++;
            matchedSkills.push(skill);
          }
        });

        // Calculate a match score based on skill matches and position in the list
        // Formula: base percentage + skill match percentage - position penalty
        const baseScore = 70; // Start with a decent base score
        const skillMatchPercentage =
          userSkills.length > 0
            ? Math.floor((matchCount / userSkills.length) * 25)
            : 15; // Up to 25% for skill matches
        const positionPenalty = Math.min(index * 2, 10); // Penalize by position, up to 10%

        const calculatedScore = Math.max(
          40,
          Math.min(95, baseScore + skillMatchPercentage - positionPenalty),
        );

        // Create a meaningful match reason
        let matchReason = "This job aligns with your profile";
        if (matchedSkills.length > 0) {
          matchReason = `This position matches your skills in ${matchedSkills
            .slice(0, 3)
            .join(", ")}${
            matchedSkills.length > 3
              ? ` and ${matchedSkills.length - 3} more`
              : ""
          }.`;

          if (
            job.title.toLowerCase().includes(profile.title?.toLowerCase() || "")
          ) {
            matchReason +=
              " The job title is very similar to your current role.";
          }

          if (
            job.location?.toLowerCase().includes("remote") &&
            profile.summary?.toLowerCase().includes("remote")
          ) {
            matchReason +=
              " This is a remote position, which you indicated preference for.";
          }
        }

        return {
          ...job,
          matchScore: calculatedScore,
          matchReason: matchReason,
        };
      });

      // Sort jobs by match score (highest first)
      const sortedJobs = [...matchedJobs].sort(
        (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
      );

      return NextResponse.json({ jobs: sortedJobs });
    }

    // Initialize OpenAI with valid API key
    const openai = new OpenAI({ apiKey });

    // Prepare the data for the OpenAI API
    const userSkills = profile.skills?.join(", ") || "";
    const userExperience =
      profile.experience
        ?.map((exp: any) => `${exp.position} at ${exp.company}`)
        .join(", ") || "";
    const userEducation =
      profile.education
        ?.map((edu: any) => `${edu.degree} from ${edu.institution}`)
        .join(", ") || "";

    // Creating a concise representation of the profile
    const profileSummary = `
      Name: ${profile.name || "Unknown"}
      Title: ${profile.title || "Unknown"}
      Skills: ${userSkills}
      Experience: ${userExperience}
      Education: ${userEducation}
      Summary: ${profile.summary || ""}
    `;

    // Prepare job data for matching
    const jobsData = jobs.map((job: JobData) => {
      return {
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements?.join(", ") || "",
        location: job.location || "",
        salaryRange: job.salaryRange || "",
        url: job.url || "",
      };
    });

    console.log("Calling OpenAI API for job matching...");

    // Call OpenAI API with o3 model as specified in requirements
    const response = await openai.chat.completions.create({
      model: "o3",
      messages: [
        {
          role: "system",
          content: `You are a job matching expert. Your task is to match a candidate's profile with job listings and rank them by relevance. For each job, provide a match score (0-100) and a brief explanation of why the job is a good match. Focus on concrete skills, experience, and requirements rather than generic statements. Be specific about why each job is a good match.`,
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
            ${analysis}
            
            For each job, provide:
            1. A match score from 0-100 (with high-quality matches being 70-95, average matches 40-70, low matches below 40)
            2. A specific explanation of why this job matches the candidate's skills and experience
            
            Return the results as a JSON array with each job having the original fields plus 'matchScore' and 'matchReason' fields.
            Format the response as: {"jobs": [...]}
          `,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0]?.message.content || "{}";
    console.log("OpenAI API response received");

    try {
      const matchedJobs = JSON.parse(content);

      // Combine the original job data with the match scores and reasons
      if (Array.isArray(matchedJobs.jobs)) {
        const enhancedJobs = matchedJobs.jobs
          .map((matchedJob: any) => {
            const originalJob = jobs.find(
              (job: JobData) =>
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
          .sort((a: any, b: any) => (b.matchScore || 0) - (a.matchScore || 0));

        return NextResponse.json({ jobs: enhancedJobs });
      }

      // If response format is unexpected but we have a valid JSON
      console.warn("Unexpected response format from OpenAI");
      return NextResponse.json({ jobs });
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw response:", content);

      // Instead of using fallback matching, throw an error
      return NextResponse.json(
        { error: "Failed to parse OpenAI response for job matching" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in match-jobs API:", error);
    return NextResponse.json(
      { error: "Failed to match jobs with profile" },
      { status: 500 },
    );
  }
}
