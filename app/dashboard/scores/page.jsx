import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ScoreForm from './ScoreForm';
import Link from 'next/link';

// Score management page for the logged-in user.
export default async function Scores() {
  // Create a server-side Supabase client.
  const s = await createClient();

  // Get the currently authenticated user.
  const {
    data: { user },
  } = await s.auth.getUser();

  // Redirect the user to login if they are not authenticated.
  if (!user) {
    redirect('/login');
  }

  // Fetch all scores belonging to the current user.
  // Latest scores are displayed first.
  const { data: scores } = await s
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  return (
    <div className="container section">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="label">
        Score management
      </div>

      <h1>
        Your latest five.
      </h1>


      {/* =====================================================
          SCORE ENTRY FORM
          ===================================================== */}

      {/* Form used to add a new Stableford score. */}
      <ScoreForm />


      {/* =====================================================
          SCORES TABLE
          ===================================================== */}

      <div
        className="card"
        style={{ marginTop: 20 }}
      >
        <table className="table">

          {/* Table headings */}
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Action</th>
            </tr>
          </thead>

          {/* Table data */}
          <tbody>

            {scores?.length > 0 ? (
              scores.map((score) => (
                <tr key={score.id}>

                  {/* Score date */}
                  <td>
                    {score.date}
                  </td>

                  {/* Stableford score */}
                  <td>
                    {score.score}
                  </td>

                  {/* Delete score action */}
                  <td>
                    <form
                      action="/api/scores/delete"
                      method="post"
                    >
                      {/* Send the score ID to the delete API */}
                      <input
                        type="hidden"
                        name="id"
                        value={score.id}
                      />

                      {/* Delete button */}
                      <button
                        className="btn danger"
                        type="submit"
                        style={{
                          padding: '7px 10px',
                        }}
                      >
                        Delete
                      </button>
                    </form>
                  </td>

                </tr>
              ))
            ) : (
              /* Display this message when no scores exist. */
              <tr>
                <td
                  colSpan="3"
                  className="muted"
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                  }}
                >
                  No scores added yet.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

    </div>
  );
}