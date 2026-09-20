import { createClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import RunDrawButton from '@/components/RunDrawButton';

// Admin dashboard for managing users, subscriptions,
// charities, and recent winners.
export default async function Admin() {
    // Create a server-side Supabase client.
    const s = await createClient();

    // Get the currently logged-in user.
    const {
        data: { user },
    } = await s.auth.getUser();

    // If the user is not logged in, send them to the login page.
    if (!user) {
        redirect('/login');
    }

    // Fetch the user's profile to check their role.
    const { data: profile } = await s
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    // Only users with the admin role can access this page.
    if (profile?.role !== 'admin') {
        redirect('/dashboard');
    }

    // Create a Supabase admin client.
    // This uses the service-role key on the server.
    const a = adminClient();

    // Fetch all admin dashboard data in parallel.
    // This makes the page faster than making each request separately.
    const [
        { count: users },
        { count: subs },
        { data: charities },
        { data: winners },
    ] = await Promise.all([
        // Count total registered users.
        a
            .from('profiles')
            .select('*', {
                count: 'exact',
                head: true,
            }),

        // Count total subscriptions.
        a
            .from('subscriptions')
            .select('*', {
                count: 'exact',
                head: true,
            }),

        // Get all charities sorted alphabetically.
        a
            .from('charities')
            .select('*')
            .order('name'),

        // Get the 20 most recent winners.
        a
            .from('winners')
            .select('*')
            .order('created_at', {
                ascending: false,
            })
            .limit(20),
    ]);

    return (
        <div className="container section">

            {/* =====================================================
          ADMIN HEADER
          ===================================================== */}

            <div className="label">
                Admin control
            </div>

            <h1>
                Operations.
            </h1>


            {/* =====================================================
          DRAW CONTROL
          ===================================================== */}

            <div className="actions">
                {/* Button used by the admin to run a new draw. */}
                <RunDrawButton />
            </div>


            {/* =====================================================
          ADMIN STATISTICS
          ===================================================== */}

            <div
                className="grid grid-3"
                style={{ marginTop: 28 }}
            >

                {/* Total users */}
                <div className="card">
                    <div className="label">
                        Users
                    </div>

                    <div className="stat">
                        {users || 0}
                    </div>
                </div>


                {/* Total subscriptions */}
                <div className="card">
                    <div className="label">
                        Active subscriptions
                    </div>

                    <div className="stat">
                        {subs || 0}
                    </div>
                </div>


                {/* Total charities */}
                <div className="card">
                    <div className="label">
                        Charities
                    </div>

                    <div className="stat">
                        {charities?.length || 0}
                    </div>
                </div>

            </div>


            {/* =====================================================
          CHARITIES SECTION
          ===================================================== */}

            <section className="section">

                <h2>
                    Charities
                </h2>

                <div className="card">

                    <table className="table">

                        {/* Charity table headings */}
                        <thead>
                            <tr>
                                <th>
                                    Name
                                </th>

                                <th>
                                    Status
                                </th>
                            </tr>
                        </thead>


                        {/* Charity records */}
                        <tbody>

                            {charities?.map((charity) => (
                                <tr key={charity.id}>

                                    {/* Charity name */}
                                    <td>
                                        {charity.name}
                                    </td>

                                    {/* Charity active/hidden status */}
                                    <td>
                                        <span className="pill">
                                            {charity.active
                                                ? 'Active'
                                                : 'Hidden'}
                                        </span>
                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>

            </section>


            {/* =====================================================
          RECENT WINNERS SECTION
          ===================================================== */}

            <section className="section">

                <h2>
                    Recent winners
                </h2>

                <div className="card">

                    <table className="table">

                        {/* Winner table headings */}
                        <thead>
                            <tr>
                                <th>
                                    User
                                </th>

                                <th>
                                    Prize
                                </th>

                                <th>
                                    Status
                                </th>
                            </tr>
                        </thead>


                        {/* Winner records */}
                        <tbody>

                            {winners?.map((winner) => (
                                <tr key={winner.id}>

                                    {/* User ID of the winner */}
                                    <td>
                                        {winner.user_id}
                                    </td>

                                    {/* Prize amount */}
                                    <td>
                                        ₹
                                        {Number(
                                            winner.prize_amount
                                        ).toFixed(2)}
                                    </td>

                                    {/* Prize payment status */}
                                    <td>
                                        {winner.payment_status}
                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}
