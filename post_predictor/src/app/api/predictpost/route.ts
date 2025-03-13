import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import FirecrawlApp from '@mendable/firecrawl-js';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 45;

const PredictionDataSchema = z.object({
  viralityScore: z.number(),
  trendingScore: z.number(),
  contentScore: z.number(),
  analysis: z.string(),
  maxLikesIn24Hours: z.number()
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getPredictionData(tweetIdea: string, apiKey?: string) {
  console.log("Starting getPredictionData with tweet:", tweetIdea);

  let HNStories = '';

  // Only fetch HackerNews data if API key is provided
  if (apiKey) {
    // Define schema for story extraction
    const storySchema = z.array(
      z.object({
        post_title: z.string(),
        post_points: z.number()
      })
    );

    // Initialize Firecrawl with provided API key
    const app = new FirecrawlApp({
      apiKey: apiKey
    });

    // Scrape HackerNews stories
    const HackerNewsResponse = await app.scrapeUrl('https://news.ycombinator.com', {
      formats: ['json'],
      jsonOptions: {
        schema: storySchema
      }
    });

    if (!HackerNewsResponse.success) {
      throw new Error(`Failed to scrape HackerNews: ${HackerNewsResponse.error}`);
    }

    // Concatenate story titles into string
    //@ts-ignore
    HNStories = HackerNewsResponse.json?.items
      .map((story: {post_title: string; post_points: number}) => `${story.post_title} (${story.post_points} points)`)
      .join('\n\n');

    if (!HackerNewsResponse.success) {
      //@ts-ignore
      throw new Error(`Failed to scrape HackerNews: ${HackerNewsResponse.warning || 'Unknown error'}`);
    }
  }

  // Get trending topics from Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );

  const today = new Date().toISOString().split('T')[0];
  
  const { data: trendingTopics, error } = await supabase
    .from('trending_topics')
    .select('topic_title, topic_desc')
    .eq('date', today);

  if (error) {
    throw new Error(`Failed to fetch trending topics: ${error.message}`);
  }

  const xTrendingTopics = trendingTopics
    .filter((trend, index, self) => 
      index === self.findIndex(t => 
        t.topic_title === trend.topic_title || t.topic_desc === trend.topic_desc
      )
    )
    .map((trend: { topic_title: string; topic_desc: string }) => `${trend.topic_title}: ${trend.topic_desc}`)
    .join('\n');

  try {
    console.log("Attempting OpenAI completion...");
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "user",
          content: `You are an expert at analyzing tweets and predicting their performance. Provide scores and analysis for the given tweet.  The response must match this format:

- viralityScore: number between 0-100 indicating viral potential
- trendingScore: number between 0-100 indicating likelihood to trend
- contentScore: number between 0-100 indicating content quality
- analysis: a 1-2 sentence string explaining the scores and predictions and feedback and a suggestion on how they might want to improve the tweet. Mention if they are riding a trend you are seeing. Do NOT suggest hastags.
- maxLikesIn24Hours: number between 0-2500 indicating the maximum number of likes the tweet is likely to get in 24 hours

\n\n

Here are examples of viral formatted tweets to calibrate your scoring:\n\n

"Introducing o1 web crawler 🕸️ (eye catching title, has introsducing or announcing something)

It crawls entire websites with OpenAI's new o1 reasoning model and 
@firecrawl_dev (tells what is does with what I am assuming is a trending topic)
 .
 
Just state an objective and it will navigate + return the requested data in a JSON schema. (tells what it does)"

"Instantly clone any website with Cursor and Firecrawl 🔥 (catchy title, has cloning in it and trending topics I assume)

Just enter the site you want to clone into @cursorcomposer and the agent will clone it after visiting the site. (tells what it does AND tags the other accounts or tools used)"

Powered by Claude 3.5 Sonnet and our new @firecrawl_dev MCP server(tells what is going on one level deeper AND tags the other accounts or tools used)"

"Just learnt that WhatsApp has not 10, not 20, but... 150 designers. (interesting / eye catching insighs that people might not know about a company people do know about)

All working tirelessly to make sure the app looks exactly the same as it did in 2014. (makes a joke about what is looks like, also is kinda contravershal which is good for engagement/ virality)"

"This is shocking. (eye catching title, shocking / insane is good for engagement)

Facebook gave Netflix all your private messages on Messenger in exchange for all your watch history, while Netflix paid them $100M+ for ads. (company we all know and use with a new insight)

Meta will sell your data at a heartbeat for profit. (pointing out a common insight reinforces a common view that big tech sells our data)"\n\n

"Next I'm buying Coca-Cola to put the cocaine back in"	(This goes viral because Elon tweeted it and after he aquired twitter, that was a joke and a major trending news topic combined Elon)

Sometimes you wont know whether a topic is trending but try your best to make a prediction.

Here are some trending topics from HackerNews and X in the last 24 hours:\n\n

${HNStories}

\n\n

${xTrendingTopics}

\n\n

Here is the tweet you are grading:\n\n ${tweetIdea}`
        }
      ],
      response_format: zodResponseFormat(PredictionDataSchema, "prediction"),
      temperature: 0.7
    });

    return completion.choices[0].message.parsed;
  } catch (error) {
    console.error("Error in getPredictionData:", error);
    throw error;
  }
}

function generateHourlyLikes(maxLikesIn24Hours: number) {
  // Array to store hourly likes
  const hourlyLikes = new Array(24).fill(0);
  
  // Start with a small percentage of max likes (0.5-2%)
  hourlyLikes[0] = Math.floor(maxLikesIn24Hours * (Math.random() * 0.015 + 0.005));
  
  // Generate random growth factors for each hour
  const remainingLikes = maxLikesIn24Hours - hourlyLikes[0];
  let currentLikes = hourlyLikes[0];
  
  // Calculate likes for hours 1-23
  for (let i = 1; i < 24; i++) {
    // Growth factor increases in middle hours (viral period)
    const hourFactor = Math.sin((i / 24) * Math.PI);
    const randomGrowth = Math.random() * 0.2 * hourFactor + 0.05;
    
    const newLikes = Math.floor(
      currentLikes + (remainingLikes * randomGrowth)
    );
    
    // If exceeding max, add small random increase
    if (newLikes >= maxLikesIn24Hours) {
      const smallIncrease = Math.max(1, Math.floor(maxLikesIn24Hours * (Math.random() * 0.05)));
      hourlyLikes[i] = currentLikes + smallIncrease;
    } else {
      hourlyLikes[i] = newLikes;
    }
    currentLikes = hourlyLikes[i];
  }
  
  // For final hour, ensure it's higher than previous hour
  const smallIncrease = Math.max(1, Math.floor(maxLikesIn24Hours * (Math.random() * 0.05)));
  hourlyLikes[23] = hourlyLikes[22] + smallIncrease;
  
  return hourlyLikes;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tweetIdea, apiKey } = body;

  if (!tweetIdea) {
    return NextResponse.json({ error: 'Tweet idea is required' }, { status: 400 });
  }

  try {
    const predictionData = await getPredictionData(tweetIdea, apiKey);
    const hourlyLikes = generateHourlyLikes(predictionData?.maxLikesIn24Hours || 0);

    return NextResponse.json({ ...predictionData, hourlyLikes });
  } catch (error: any) {
    console.error("Error in API handler:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
