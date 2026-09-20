import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Create a Supabase client for browser-side operations.
  // These are public environment variables and are safe
  // to use in client-side code.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
