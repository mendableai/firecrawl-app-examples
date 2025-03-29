import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

// Rate limiting - simple in-memory store
// In production, use a proper rate limiting solution like Redis
const RATE_LIMIT = {
  maxRequests: 3, // Maximum requests per window
  windowMs: 60 * 1000, // 1 minute window
  ipRequests: new Map<string, { count: number; resetTime: number }>(),
};

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";

    // Check rate limit
    const now = Date.now();
    const requestData = RATE_LIMIT.ipRequests.get(ip) || {
      count: 0,
      resetTime: now + RATE_LIMIT.windowMs,
    };

    // Reset counter if window has passed
    if (now > requestData.resetTime) {
      requestData.count = 0;
      requestData.resetTime = now + RATE_LIMIT.windowMs;
    }

    // Increment counter and check limit
    requestData.count++;
    RATE_LIMIT.ipRequests.set(ip, requestData);

    if (requestData.count > RATE_LIMIT.maxRequests) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { script } = body;

    if (!script) {
      return NextResponse.json(
        { error: "No script provided for audio generation" },
        { status: 400 },
      );
    }

    // Limit script length to prevent excessive API usage
    const MAX_SCRIPT_LENGTH = 5000; // Characters
    if (script.length > MAX_SCRIPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Script exceeds maximum length of ${MAX_SCRIPT_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key is not configured" },
        { status: 500 },
      );
    }

    // Initialize ElevenLabs client
    const client = new ElevenLabsClient({
      apiKey: apiKey,
    });

    // Use a female voice for Firo (the AI host)
    // Rachel voice - one of the best female voices on ElevenLabs
    const FIRO_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

    try {
      // Generate audio for the entire script
      const audio = await client.textToSpeech.convert(FIRO_VOICE_ID, {
        text: script,
        model_id: "eleven_multilingual_v2",
        output_format: "mp3_44100_128",
      });

      // Convert audio stream to buffer then to base64
      const chunks: Uint8Array[] = [];
      for await (const chunk of audio) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      const base64Audio = buffer.toString("base64");

      return NextResponse.json({
        success: true,
        audioSegments: [
          {
            host: "Firo",
            audio: base64Audio,
          },
        ],
        script,
      });
    } catch (error: any) {
      console.error("Error generating audio:", error);

      // If rate limit exceeded
      if (
        error.status === 429 ||
        (error.response && error.response.status === 429)
      ) {
        return NextResponse.json(
          {
            error:
              "ElevenLabs rate limit exceeded. Please try again later or reduce content length.",
          },
          { status: 429 },
        );
      }

      throw error;
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    return NextResponse.json(
      { error: "Failed to generate podcast audio" },
      { status: 500 },
    );
  }
}
