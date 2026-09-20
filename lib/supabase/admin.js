import { createClient } from '@supabase/supabase-js';

export function adminClient() {
  // Create a Supabase admin client using the service-role key.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        // Do not automatically refresh the admin session.
        autoRefreshToken: false,

        // Do not persist the admin session.
        persistSession: false,
      },
    }
  );
}