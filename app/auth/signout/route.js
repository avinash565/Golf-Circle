import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Handle user sign-out request.
export async function POST(req) {
  // Create a server-side Supabase client.
  const s = await createClient();

  // Sign out the currently authenticated user.
  await s.auth.signOut();

  // Redirect the user back to the home page
  // after successfully signing out.
  return NextResponse.redirect(
    new URL('/', req.url),
    303
  );
}