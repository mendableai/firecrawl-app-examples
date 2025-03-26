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

    // Format API key with fc- prefix if missing
    const formattedApiKey = apiKey.startsWith("fc-") ? apiKey : `fc-${apiKey}`;

    // Skip validation and just return success
    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing API key:", error);
    return NextResponse.json(
      { valid: false, message: "Error processing API key" },
      { status: 500 },
    );
  }
}
