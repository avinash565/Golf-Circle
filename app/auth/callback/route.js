import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Handle the OAuth authentication callback.
export async function GET(req) {
  // Convert the incoming request URL into a URL object
  // so that we can read query parameters.
  const url = new URL(req.url);

  // Get the authentication code returned by Supabase
  // after the OAuth login process.
  const code = url.searchParams.get('code');

  // Exchange the temporary authentication code
  // for a valid Supabase user session.
  if (code) {
    // Create a server-side Supabase client.
    const supabase = await createClient();

    // Exchange the OAuth code for an authenticated session.
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After successful authentication, redirect the user
  // to the dashboard.
  return NextResponse.redirect(
    new URL('/dashboard', url.origin)
  );
}
