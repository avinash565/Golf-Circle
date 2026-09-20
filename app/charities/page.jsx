import { createClient } from '@/lib/supabase/server';

// Display all active charities available to users.
export default async function Charities() {
    // Create a server-side Supabase client.
    const s = await createClient();

    // Fetch only active charities from the database.
    // Charities are displayed alphabetically by name.
    const { data } = await s
        .from('charities')
        .select('*')
        .eq('active', true)
        .order('name');

    return (
        <div className="container section">

            {/* PAGE HEADER */}

            <div className="label">
                Give back
            </div>

            <h1>
                Choose a cause.
            </h1>

            {/* Explain the minimum charity contribution. */}
            <p className="muted">
                Every subscriber directs at least 10% of their fee
                to a chosen charity.
            </p>


            {/* =====================================================
          CHARITY CARDS
          ===================================================== */}

            <div
                className="grid grid-3"
                style={{ marginTop: 28 }}
            >

                {/* Render each active charity as a separate card. */}
                {data?.map((charity) => (
                    <article
                        className="card"
                        key={charity.id}
                    >

                        {/* Charity name */}
                        <h3>
                            {charity.name}
                        </h3>

                        {/* Charity description */}
                        <p>
                            {charity.description}
                        </p>

                        {/* Open the charity's official website
                in a new browser tab. */}
                        <a
                            className="btn secondary"
                            href={charity.website}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Visit website
                        </a>

                    </article>
                ))}

            </div>

        </div>
    );
}