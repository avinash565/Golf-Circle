import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET request to fetch all active charities.
export async function GET() {
  // Create a server-side Supabase client.
  const supabase = await createClient();

  // Fetch only active charities from the database.
  // Results are sorted alphabetically by charity name.
  const { data, error } = await supabase
    .from('charities')
    .select('*')
    .eq('active', true)
    .order('name');

  // Return an error response if the database query fails.
  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }

  // Return the list of active charities as JSON.
  return NextResponse.json(data);
}