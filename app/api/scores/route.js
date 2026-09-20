import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  // Create Supabase server client
  const s = await createClient();

  // Get currently authenticated user
  const {
    data: { user },
  } = await s.auth.getUser();

  // User must be logged in
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get score and date from request body
  const { date, score } = await req.json();

  // Validate score and date
  if (
    !date ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 45
  ) {
    return NextResponse.json(
      {
        error:
          'Score must be an integer from 1 to 45 and a date is required.',
      },
      { status: 400 }
    );
  }

  // Check whether a score already exists for this date
  const { data: existing } = await s
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .eq('date', date)
    .maybeSingle();

  // Do not allow duplicate scores for the same date
  if (existing) {
    return NextResponse.json(
      {
        error:
          'A score already exists for this date. Edit or delete it instead.',
      },
      { status: 409 }
    );
  }

  // Insert the new score
  const { error } = await s
    .from('scores')
    .insert({
      user_id: user.id,
      date,
      score,
    });

  // Handle database insertion error
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Get all scores for the current user,
  // sorted from oldest to newest
  const { data: all } = await s
    .from('scores')
    .select('id, date')
    .eq('user_id', user.id)
    .order('date', {
      ascending: false,
    });

  // Keep only the latest 5 scores
  if (all?.length > 5) {
    const ids = (all || [])
      .slice(5)
      .map((x) => x.id);

    // Delete scores older than the latest 5
    await s
      .from('scores')
      .delete()
      .in('id', ids);
  }

  // Return success response
  return NextResponse.json({
    ok: true,
  });
}
