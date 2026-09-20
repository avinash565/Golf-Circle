import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function updateSession(request) {
  // Create an initial response that will be returned
  // if no cookies need to be changed.
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create a Supabase server client.
  // This client allows Supabase to read and update
  // authentication cookies on the request/response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        // Read all cookies from the incoming request.
        getAll() {
          return request.cookies.getAll();
        },

        // Update cookies on both the request and response.
        setAll(cookiesToSet, _headers) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            }
          );

          // Create a fresh response with the updated request.
          supabaseResponse = NextResponse.next({
            request,
          });

          // Apply the updated cookies to the response.
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  // Refresh/validate the Supabase authentication session.
  // This helps keep the user's session available
  // across requests.
  await supabase.auth.getClaims();

  // Return the response with updated authentication cookies.
  return supabaseResponse;
}
