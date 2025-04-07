import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, message: "API key is required" },
        { status: 400 },
      );
    }

    // Only validate the key format
    if (!apiKey.startsWith("fc-")) {
      return NextResponse.json(
        {
          valid: false,
          message: "Invalid API key format. The key must start with 'fc-'",
        },
        { status: 400 },
      );
    }

    // Return success if format is valid
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing API key:", error);
    return NextResponse.json(
      {
        valid: false,
        message:
          "Please check your API key and try again. Make sure you have copied the complete key from firecrawl.dev",
      },
      { status: 500 },
    );
  }
}
