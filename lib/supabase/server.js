import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    // Get the cookies from the current request.
    const cookieStore = await cookies();

    // Create and return a Supabase client for server-side use.
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                // Read all cookies from the current request.
                getAll() {
                    return cookieStore.getAll();
                },

                // Update cookies when Supabase refreshes the session.
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(
                            ({ name, value, options }) => {
                                cookieStore.set(name, value, options);
                            }
                        );
                    } catch {
                        // Ignore this error when cookies cannot be modified.
                        // This can happen in Server Components.
                    }
                },
            },
        }
    );
}
