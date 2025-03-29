import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client outside request handler for better performance
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Anthropic API key not configured");
      return NextResponse.json(
        { error: "Server configuration error: Anthropic API key not set" },
        { status: 500 },
      );
    }

    // Parse and validate request body
    let scrapedData;
    try {
      const body = await request.json();
      scrapedData = body.scrapedData;

      if (
        !scrapedData ||
        !scrapedData.title ||
        !scrapedData.headline ||
        !scrapedData.content
      ) {
        console.error("Invalid request body:", body);
        return NextResponse.json(
          { error: "Invalid request: Missing required data fields" },
          { status: 400 },
        );
      }
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 },
      );
    }

    const userMessage = `Analyze this website's landing page content for Conversion Rate Optimization (CRO) best practices:
          
Title: ${scrapedData.title}
Headline: ${scrapedData.headline}
Subheadline: ${scrapedData.subheadline || "None"}
CTA: ${scrapedData.ctaText || "None"}
Content: ${scrapedData.content}

Please provide:
1. A score out of 100 based on CRO best practices
2. 2-3 strengths of the current landing page
3. 2-3 weaknesses or areas of improvement
4. 3-4 specific, actionable recommendations to improve conversion rates
5. A brief insight paragraph about the overall landing page effectiveness

Format your response in JSON with the following structure:
{
  "score": number,
  "strengths": [array of strings],
  "weaknesses": [array of strings],
  "recommendations": [array of strings],
  "insights": "string"
}`;

    try {
      const response = await anthropic.messages.create({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        system:
          "You are an expert in Conversion Rate Optimization (CRO) for websites. Analyze the provided landing page content and provide actionable insights. Format your response as structured JSON.",
        messages: [{ role: "user", content: userMessage }],
      });

      const content =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch =
        content.match(/```json([\s\S]*?)```/) || content.match(/{[\s\S]*?}/);

      if (!jsonMatch) {
        console.error("Invalid response format from AI:", content);
        return NextResponse.json(
          { error: "Failed to generate analysis" },
          { status: 500 },
        );
      }

      const jsonString = jsonMatch[0].replace(/```json|```/g, "").trim();
      try {
        const parsedResult = JSON.parse(jsonString);
        return NextResponse.json(parsedResult);
      } catch (parseError) {
        console.error("Error parsing Anthropic's JSON response:", parseError);
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 },
        );
      }
    } catch (anthropicError) {
      console.error("Anthropic API error:", anthropicError);
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unexpected error in analyze endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
