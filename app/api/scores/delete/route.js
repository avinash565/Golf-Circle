import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  // Create Supabase server client
  const s = await createClient();

  // Get the currently authenticated user
  const {
    data: { user },
  } = await s.auth.getUser();

  // If the user is not logged in, redirect them to the login page
  if (!user) {
    return NextResponse.redirect(
      new URL('/login', req.url)
    );
  }

  // Read form data submitted by the delete form
  const form = await req.formData();

  // Get the score ID from the submitted form
  const scoreId = String(form.get('id'));

  // Delete the score only if it belongs to the logged-in user
  await s
    .from('scores')
    .delete()
    .eq('id', scoreId)
    .eq('user_id', user.id);

  // Redirect back to the scores page after deletion
  return NextResponse.redirect(
    new URL('/dashboard/scores', req.url)
  );
}
