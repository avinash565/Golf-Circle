import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Nav() {
  // Create Supabase server client.
  const supabase = await createClient();

  // Get the currently logged-in user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="nav">
      <div className="container nav-inner">

        {/* Website logo */}
        <Link className="brand" href="/">
        <div className='golf'>
        <img src="golf-club.png" alt="" width={40}/>
          Golf<span>Circle</span> 
          </div>
        </Link>

        <nav className="navlinks">

          {/* Public navigation links */}
          <Link className="hide-mobile" href="/charities">
            Charities
          </Link>

          <Link className="hide-mobile" href="/draw">
            Draw
          </Link>


          {/* Show user email and Sign out only when logged in */}
          {user ? (
            <>
              {/* Dashboard is available only to logged-in users */}
              <Link href="/dashboard">
                Dashboard
              </Link>

              {/* Logged-in user's email */}
              <span className="muted email-truncate">
                {user.email}
              </span>

              {/* Sign-out button */}
              <form action="/auth/signout" method="post">
                <button className="btn" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            /* Show Login and Subscribe when user is NOT logged in */
            <>
              <Link className='btn1' href="/login">
                Login
              </Link>

              <Link className="btn" href="/signup">
                Subscribe
              </Link>
            </>
          )}

        </nav>
      </div>
    </header>
  );
}
