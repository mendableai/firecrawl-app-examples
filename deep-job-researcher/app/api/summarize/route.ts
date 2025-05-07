import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
// Using Assistants API for file processing

type Summary = {
  job_profiles: Array<{
    title: string;
    company: string;
    start_date: string;
    end_date: string;
    description?: string;
  }>;
  skills: string[];
  name?: string;
  title?: string;
  summary_text?: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Helper Function to Poll Run Status ---
async function pollRunStatus(
  threadId: string,
  runId: string,
): Promise<OpenAI.Beta.Threads.Runs.Run> {
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);
  while (run.status === "queued" || run.status === "in_progress") {
    // Wait for a short period before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
    console.log("Run status:", run.status);
  }
  return run;
}

// --- API Route Handler ---
export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return NextResponse.json(
      { error: "Server configuration error: OpenAI API key missing" },
      { status: 500 },
    );
  }

  let assistantId = process.env.OPENAI_ASSISTANT_ID; // Optional: Reuse an existing assistant
  let fileId: string | null = null; // To store the uploaded file ID
  let threadId: string | null = null; // To store the thread ID

  try {
    console.log("API route handler started - Assistants Workflow");

    // === Get File ===
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    console.log(`Received file: ${file.name}`);

    // === 1. Upload File ===
    console.log("Uploading file (purpose: assistants)...");
    const uploadedFile = await openai.files.create({
      file: file,
      purpose: "assistants",
    });
    fileId = uploadedFile.id;
    console.log(`File uploaded successfully. File ID: ${fileId}`);

    // === 2. Create or Retrieve Assistant ===
    const assistantInstructions = `You are an expert resume analyzer. Extract relevant professional skills and experiences from the provided PDF resume file attached to the user message.

**Primary Task: Extract Skills**
- Focus on specific skills, technologies, tools, languages, frameworks, methodologies.
- Prioritize items listed in explicit "Skills" sections.

**Filtering Guidance:**
- Avoid generic category names (e.g., "Technical Skills").
- Generally exclude social platforms (LinkedIn) or basic software (Word) unless used technically.
- Exclude project/company names as skills.

**Output Format:**
Respond ONLY with a valid JSON object containing these keys:
- skills: string array of filtered, relevant skills found.
- job_profiles: array of objects {title, company, start_date, end_date, description}
- name: string (if found)
- title: string (if found)
- summary_text: string (if found)
`;

    if (!assistantId) {
      console.log("Creating new Assistant...");
      const assistant = await openai.beta.assistants.create({
        name: "Resume Analyzer",
        instructions: assistantInstructions,
        model: "gpt-4o", // Use a capable model
        tools: [{ type: "code_interpreter" }], // Ensure the Assistant has the tool enabled
      });
      assistantId = assistant.id;
      console.log(`New Assistant created. ID: ${assistantId}`);
    } else {
      console.log(`Using existing Assistant ID: ${assistantId}`);
    }

    // === 3. Create Thread ===
    console.log("Creating new Thread...");
    const thread = await openai.beta.threads.create();
    threadId = thread.id;
    console.log(`Thread created. ID: ${threadId}`);

    // === 4. Add Message to Thread with File Attachment ===
    console.log(
      `Adding message to thread ${threadId} with file attachment ${fileId}...`,
    );
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content:
        "Please analyze the attached resume PDF and extract the skills and experience according to your instructions. Respond only with the JSON object.",
      attachments: [{ file_id: fileId, tools: [{ type: "code_interpreter" }] }],
    });
    console.log("Message added to thread.");

    // === 5. Run the Thread ===
    console.log(`Running assistant ${assistantId} on thread ${threadId}...`);
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      // Optional: Override instructions for this specific run if needed
      // instructions: assistantInstructions
    });
    console.log(`Run created. Run ID: ${run.id}, Status: ${run.status}`);

    // === 6. Poll Run Status ===
    console.log("Polling run status...");
    const completedRun = await pollRunStatus(threadId, run.id);

    if (completedRun.status !== "completed") {
      console.error(
        `Run failed or was cancelled. Final status: ${completedRun.status}`,
        completedRun.last_error,
      );
      throw new Error(
        `Assistant run failed with status: ${completedRun.status}`,
      );
    }
    console.log("Run completed successfully.");

    // === 7. Retrieve Messages ===
    console.log("Retrieving messages from thread...");
    const messages = await openai.beta.threads.messages.list(threadId, {
      order: "desc", // Get the latest messages first
      limit: 1, // We only need the assistant's last response
    });

    // Find the latest assistant message
    const assistantMessage = messages.data.find((m) => m.role === "assistant");

    if (!assistantMessage || assistantMessage.content[0]?.type !== "text") {
      console.error("Assistant response not found or not text:", messages.data);
      throw new Error(
        "Could not retrieve a valid text response from the assistant.",
      );
    }

    const responseText = assistantMessage.content[0].text.value;
    console.log("Raw Assistant response text:", responseText);

    // === 8. Parse the JSON response from Assistant ===
    let extractedData: Partial<Summary>;
    try {
      let jsonString = responseText;

      // Strip markdown code blocks if present
      jsonString = jsonString
        .replace(/```json\s*/g, "")
        .replace(/```\s*$/g, "");

      // Find the JSON object
      const match = jsonString.match(/\{[\s\S]*\}/);
      if (match) {
        jsonString = match[0];
      }

      // Log the exact string we are trying to parse
      console.log("Attempting to parse JSON string:", jsonString);

      try {
        // First attempt to parse as is
        extractedData = JSON.parse(jsonString);
      } catch (firstParseError) {
        console.warn(
          "Initial JSON parse failed, attempting to fix malformed JSON:",
          firstParseError,
        );

        // Advanced JSON repair function
        const repairJSON = (brokenJson: string): string => {
          // Fix trailing commas in arrays and objects
          let fixedJson = brokenJson
            .replace(/,\s*]/g, "]")
            .replace(/,\s*}/g, "}");

          // Add missing commas between array elements
          fixedJson = fixedJson.replace(/][ \t\n\r]*\[/g, "],[");
          fixedJson = fixedJson.replace(/}[ \t\n\r]*{/g, "},{");
          fixedJson = fixedJson.replace(/}[ \t\n\r]*\[/g, "},[");
          fixedJson = fixedJson.replace(/][ \t\n\r]*{/g, "],{");

          // Fix quotes - ensure property names are quoted
          fixedJson = fixedJson.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

          // Fix missing commas in arrays (common error at position detection)
          fixedJson = fixedJson.replace(/"[ \t\n\r]*"/g, '","');

          // Fix double quotes inside already quoted strings
          // We need to be careful with this one
          fixedJson = fixedJson.replace(/"([^"]*)""/g, '"$1\\"');
          fixedJson = fixedJson.replace(/""([^"]*)"/g, '\\"$1"');

          // Delete any remaining invalid characters
          fixedJson = fixedJson.replace(/[\x00-\x1F\x7F]/g, "");

          return fixedJson;
        };

        // Apply repairs and try to parse again
        jsonString = repairJSON(jsonString);
        console.log("Attempting to parse repaired JSON string:", jsonString);

        try {
          extractedData = JSON.parse(jsonString);
        } catch (secondParseError) {
          // If still fails, try a more aggressive approach - manually build a valid JSON
          console.warn(
            "Repair attempt failed, trying more aggressive approach",
          );

          // Extract content from the malformed JSON - without using 's' flag
          const skillsMatch = jsonString.match(/"skills"\s*:\s*\[([\s\S]*?)\]/);
          const jobsMatch = jsonString.match(
            /"job_profiles"\s*:\s*\[([\s\S]*?)\]/,
          );
          const nameMatch = jsonString.match(/"name"\s*:\s*"([^"]*)"/);
          const titleMatch = jsonString.match(/"title"\s*:\s*"([^"]*)"/);
          const summaryMatch = jsonString.match(
            /"summary_text"\s*:\s*"([^"]*)"/,
          );

          // Reconstruct a minimal valid JSON
          const skills = skillsMatch ? `[${skillsMatch[1]}]` : "[]";
          const jobs = jobsMatch ? `[${jobsMatch[1]}]` : "[]";

          // Build a clean JSON object
          const cleanJson = `{
            "skills": ${skills.replace(/'/g, '"').replace(/,\s*]/g, "]")},
            "job_profiles": ${jobs.replace(/'/g, '"').replace(/,\s*]/g, "]")},
            "name": ${nameMatch ? `"${nameMatch[1]}"` : "null"},
            "title": ${titleMatch ? `"${titleMatch[1]}"` : "null"},
            "summary_text": ${summaryMatch ? `"${summaryMatch[1]}"` : "null"}
          }`;

          console.log(
            "Attempting to parse manually reconstructed JSON:",
            cleanJson,
          );
          extractedData = JSON.parse(cleanJson);
        }
      }

      console.log("Successfully parsed Assistant JSON response");
    } catch (parseError: any) {
      console.error(
        "Failed to parse JSON response from Assistant:",
        parseError,
        "\nRaw Text Was:",
        responseText,
      );
      throw new Error(
        `Invalid JSON format received from Assistant: ${parseError.message}`,
      );
    }

    // === 9. Format and Return ===
    const finalSummary: Summary = {
      job_profiles: extractedData.job_profiles || [],
      skills: extractedData.skills || [],
      name: extractedData.name,
      title: extractedData.title,
      summary_text: extractedData.summary_text,
    };
    console.log("Returning extracted summary data");
    return NextResponse.json(finalSummary);
  } catch (error: any) {
    console.error("API route error in Assistants Workflow:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to process resume using Assistant API",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  } finally {
  
  }
}
