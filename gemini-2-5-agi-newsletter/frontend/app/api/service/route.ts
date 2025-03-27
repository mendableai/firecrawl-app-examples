// /pages/api/service.js or /app/api/service/route.js (depending on your Next.js version)
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Delete all users
await supabase.from("users").delete().neq("id", 0);

// Insert new user
await supabase.from("users").insert({
  email: "aparupganguly86@gmail.com",
});

// Handle POST requests
export async function POST(request: Request) {
  try {
    const { email, sources } = await request.json();

    // Check if the user already exists
    let { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (userError && userError.code !== "PGRST116") {
      // PGRST116: No rows found, which is acceptable
      throw userError;
    }

    // If user doesn't exist, insert them
    let userId;
    if (!existingUser) {
      const { data: newUser, error: insertUserError } = await supabase
        .from("users")
        .insert({ email })
        .select()
        .single();

      if (insertUserError) throw insertUserError;
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
      from: "AGI News <newsletter@resend.dev>",
      to: email,
      subject: "Hello from AGI News",
      text: "Congratulations! You have successfully subscribed to AGI News. We will send you a daily email with the latest news in AI starting tomorrow.",
    });

    return NextResponse.json({
      message: "Data inserted successfully and email sent!",
    });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 },
      );
    }
  }
}
