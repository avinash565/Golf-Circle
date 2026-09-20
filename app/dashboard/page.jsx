import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CheckoutButton from '@/components/CheckoutButton';
import Link from 'next/link';

// Dashboard page for authenticated users.
export default async function Dashboard() {
  // Create a server-side Supabase client.
  const s = await createClient();

  // Get the currently logged-in user.
  const {
    data: { user },
  } = await s.auth.getUser();

  // Redirect unauthenticated users to the login page.
  if (!user) {
    redirect('/login');
  }

  // Fetch all dashboard-related data in parallel.
  const [
    { data: profile },
    { data: scores },
    { data: sub },
    { data: wins },
  ] = await Promise.all([
    // Fetch the user's profile information.
    s.from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),

    // Fetch the user's Stableford scores,
    // with the latest scores shown first.
    s.from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),

    // Fetch the user's latest subscription
    // along with the selected charity name.
    s.from('subscriptions')
      .select('*, charities(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Fetch the user's previous draw winnings.
    s.from('winners')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  // Admin users are redirected to the admin dashboard.
  if (profile?.role === 'admin') {
    redirect('/dashboard/admin');
  }

  return (
    <div className="container section">

      {/* DASHBOARD HEADER */}

      <div className="split">

        {/* User greeting */}
        <div>
          <div className="label">
            Your dashboard
          </div>

          <h1>
            Hello, {profile?.full_name || user.email}
          </h1>
        </div>

        {/* Link to score management page */}
        <Link
          className="btn"
          href="/dashboard/scores"
        >
          Manage scores
        </Link>
      </div>


      {/* DASHBOARD SUMMARY CARDS */}

      <div
        className="grid grid-3"
        style={{ marginTop: 28 }}
      >

        {/* SUBSCRIPTION CARD */}

        <div className="card">
          <div className="label">
            Subscription
          </div>

          {/* Show current subscription status */}
          <div className="stat">
            {sub?.status || 'Inactive'}
          </div>

          {/* Show selected plan */}
          <p className="muted">
            {sub?.plan || 'No plan selected'}
          </p>

          {/* Show subscription options if user is not active */}
          {sub?.status !== 'active' && (
            <div className="actions">

              {/* Monthly subscription */}
              <CheckoutButton plan="monthly" />

              {/* Yearly subscription */}
              <CheckoutButton plan="yearly" />

            </div>
          )}
        </div>


        {/* CHARITY CARD */}

        <div className="card">
          <div className="label">
            Charity
          </div>

          {/* Display selected charity */}
          <h3>
            {sub?.charities?.name || 'Not selected'}
          </h3>

          {/* Display charity contribution percentage */}
          <p className="muted">
            {sub?.charity_percent || 10}% contribution
          </p>
        </div>


        {/* WINNINGS CARD */}

        <div className="card">
          <div className="label">
            Winnings
          </div>

          {/* Calculate total prize amount won */}
          <div className="stat">
            ₹
            {(wins || []).reduce(
              (a, w) =>
                a + Number(w.prize_amount || 0),
              0
            ).toLocaleString()}
          </div>
        </div>

      </div>


      {/* LATEST SCORES SECTION */}

      <section className="section">

        {/* Section heading and edit link */}
        <div className="split">
          <h2>
            Latest 5 scores
          </h2>

          <Link href="/dashboard/scores">
            Edit
          </Link>
        </div>


        {/* Scores table */}
        <div className="card">
          <table className="table">

            {/* Table header */}
            <thead>
              <tr>
                <th>Date</th>
                <th>Stableford</th>
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {scores?.map((x) => (
                <tr key={x.id}>
                  <td>{x.date}</td>
                  <td>{x.score}</td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </section>

    </div>
  );
}