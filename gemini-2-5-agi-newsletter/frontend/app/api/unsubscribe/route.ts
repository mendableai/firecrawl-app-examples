
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Handle GET requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return new Response('<html><body><h1 style="color:red;">Error: Email is required</h1></body></html>', {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Delete the user from the database
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (deleteError) throw deleteError;

    return new Response('<html><body><h1 style="color:green;">Successfully unsubscribed</h1></body></html>', {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(`<html><body><h1 style="color:red;">Error: ${errorMessage}</h1></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}