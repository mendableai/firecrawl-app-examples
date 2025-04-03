import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import FirecrawlApp from "@mendable/firecrawl-js";
import OpenAI from "openai";

dotenv.config();

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": process.env.SITE_NAME,
  },
});

export async function generateNewsletter(rawStories: string) {
  console.log(
    `Generating newsletter with raw stories (${rawStories.length} characters)...`,
  );

  try {
    const prompt = `Given a list of raw AI and LLM-related stories sourced from various platforms, create a concise TL;DR-style email newsletter called 'AGI News' with up to the 10 most interesting and impactful stories. Prioritize stories that cover product launches, demos, and innovations in AI/LLM technology.

Title: AGI News – Your Quick Daily Roundup
Introduction: A one-sentence overview introducing the daily roundup and the newsletter which is a daily AI newsletter sourced by AI agents & Firecrawl 🔥.

For each story (up to 10):
- Headline: [Story Headline]
- Summary: Brief, compelling summary of the story's main points or implications (1-2 sentences max)
- Link: [Insert link]

IMPORTANT:
1. Return the content in clean HTML format without any code block markers
2. Start directly with the h1 tag
3. Format each story with proper HTML tags (h2 for headlines, p for summaries)
4. Include proper href attributes for all links
5. Do not include any markdown or code formatting
6. Do not wrap the content in additional html or body tags

Here is the raw stories: ${rawStories}`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const newsletter = completion.choices[0].message.content || "";

    console.log(
      `Newsletter generated successfully with ${newsletter.length} characters.`,
    );
    console.log("Generated Newsletter:", newsletter);

    return newsletter;
  } catch (error) {
    console.log("Error generating newsletter:", error);
  }
}
