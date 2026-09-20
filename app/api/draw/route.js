import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import {randomNumbers, weightedNumbers,prizeSplit } from '@/lib/draw';
import { NextResponse } from 'next/server';

// Handle POST request for running a new draw
export async function POST() {
  // Create Supabase client
  const s = await createClient();

  // Get the currently logged-in user
  const {
    data: { user },
  } = await s.auth.getUser();

  // Reject request if the user is not logged in
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get the user's role from the profiles table
  const { data: p } = await s
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only administrators are allowed to run a draw
  if (p?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Create admin-level Supabase client
  const a = adminClient();

  // Get all users who currently have an active subscription
  const { data: subs } = await a
    .from('subscriptions')
    .select('user_id')
    .eq('status', 'active');

  // Get all submitted scores
  const { data: scores } = await a
    .from('scores')
    .select('score');

  // Calculate the prize pool.
  // Currently, each active subscriber contributes 10.
  const pool = (subs?.length || 0) * 10;

  // Generate 5 random numbers for the draw
  const numbers = randomNumbers(5);

  // Split the prize pool according to the prize rules
  const prizes = prizeSplit(pool);

  // Save the generated draw in the database
  const { data: draw, error } = await a
    .from('draws')
    .insert({
      draw_date: new Date().toISOString(),
      numbers,
      method: 'random',
      prize_pool: pool,
      status: 'published',
    })
    .select()
    .single();

  // Return database error if the draw could not be created
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Return the created draw, numbers, and prize distribution
  return NextResponse.json({
    draw,
    numbers,
    prizes,
  });
}
