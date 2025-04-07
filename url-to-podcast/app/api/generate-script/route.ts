import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extractedContent, sourceUrls = [] } = body;

    if (!extractedContent) {
      return NextResponse.json(
        { error: "No content provided for script generation" },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Anthropic API key is not configured" },
        { status: 500 },
      );
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Get source website names for customizing the intro
    const sourceNames = sourceUrls.map((url: string) => {
      try {
        const urlObj = new URL(url);
        // Extract domain without www. prefix
        return urlObj.hostname.replace("www.", "");
      } catch {
        return url;
      }
    });

    // Prepare prompt content based on the extracted data
    let promptContent =
      "Generate a podcast script based on the following extracted content:\n\n";

    // Add source URLs context
    promptContent += `Source URLs: ${sourceUrls.join(", ")}\n`;
    promptContent += `Source Websites: ${sourceNames.join(", ")}\n\n`;

    // Check data structure and process accordingly
    if (Array.isArray(extractedContent)) {
      extractedContent.forEach((content, index) => {
        promptContent += `Content ${index + 1}:\n`;
        promptContent += `Title: ${content.title}\n`;
        promptContent += `Summary: ${content.summary}\n`;
        promptContent += `Main Content: ${content.main_content}\n`;

        // Handle key points
        if (content.key_points && content.key_points.length > 0) {
          promptContent += `Key Points: ${content.key_points.join(", ")}\n`;
        }

        // Handle news items if they exist (for aggregator sites)
        if (content.news_items && content.news_items.length > 0) {
          promptContent += `\nNews Items:\n`;
          content.news_items.forEach((item: any, i: number) => {
            promptContent += `  ${i + 1}. ${item.title} - ${
              item.description
            }\n`;
          });
        }

        promptContent += "\n\n";
      });
    } else {
      // If it's a single object, process it directly
      promptContent += `Content:\n`;
      promptContent += `Title: ${extractedContent.title || "Untitled"}\n`;
      promptContent += `Summary: ${
        extractedContent.summary || "No summary available"
      }\n`;
      promptContent += `Main Content: ${
        extractedContent.main_content || "No content available"
      }\n`;

      // Handle key points
      if (
        extractedContent.key_points &&
        Array.isArray(extractedContent.key_points)
      ) {
        promptContent += `Key Points: ${extractedContent.key_points.join(
          ", ",
        )}\n`;
      }

      // Handle news items if they exist (for aggregator sites)
      if (
        extractedContent.news_items &&
        Array.isArray(extractedContent.news_items) &&
        extractedContent.news_items.length > 0
      ) {
        promptContent += `\nNews Items:\n`;
        extractedContent.news_items.forEach((item: any, i: number) => {
          promptContent += `  ${i + 1}. ${item.title} - ${item.description}\n`;
        });
      }

      promptContent += "\n\n";
    }

    // Limit prompt content length to avoid exceeding token limits
    const MAX_PROMPT_LENGTH = 12000; // Approximately 3000 tokens
    if (promptContent.length > MAX_PROMPT_LENGTH) {
      promptContent =
        promptContent.substring(0, MAX_PROMPT_LENGTH) +
        "...\n\n(Content truncated due to length)";
    }

    // Get site-specific context for the system prompt
    const sitesDescription =
      sourceNames.length > 0 ? sourceNames.join(", ") : "the web";

    const systemPrompt = `You are an expert podcast scriptwriter for a tech news and internet trends show. 
    Create an engaging podcast script with a single AI host named Firo.
    
    The script should:
    - Begin with an introduction like "Hey! I'm your host Firo, welcome to our podcast" that specifically mentions the source websites: ${sitesDescription}
    - Your introduction should be CUSTOMIZED to the specific websites/URLs the content comes from - do NOT mention Hacker News unless that's actually one of the source URLs
    - If multiple URLs are provided (${sourceUrls.length} URLs in this case), EXPLICITLY MERGE their content into a cohesive narrative that flows well
    - For multiple sources, clearly transition between different sources with phrases like "Moving on to our next source..." or "Another interesting perspective comes from..."
    - If news items are present, make this a news roundup style podcast discussing the top stories
    - If it's a single article, present a deep-dive discussion of the topic
    - Present information in a conversational, friendly way as if Firo is talking directly to the listener
    - Have a natural flow with clear transitions between different topics or news items
    - Include rhetorical questions or moments of reflection to engage the listener
    - Have a conclusion summarizing key points from ALL sources
    - Be between 3-4 minutes when read aloud at a natural pace
    - IMPORTANT: Keep the total script under 4500 characters to fit technical limitations
    - NOT use any speaker labels like "HOST:" or "FIRO:" - just write the script as continuous prose
    - Sound natural, not like AI-generated content
    - Use casual, friendly language while remaining informative`;

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: promptContent,
        },
      ],
    });

    // Extract the text content from the response
    const scriptText =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Failed to generate script text";

    return NextResponse.json({
      success: true,
      script: scriptText,
    });
  } catch (error) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { error: "Failed to generate podcast script" },
      { status: 500 },
    );
  }
}
