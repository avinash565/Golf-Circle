import Link from 'next/link';

// Home page of the Digital Heroes application.
export default function Home() {
  return (
    <>
      {/* Main introduction and primary actions */}

      <section className="hero">
        <div className="container">

          {/* Small introductory label */}
          <div className="label">
            Golf • Give • Win
          </div>

          {/* Main page heading */}
          <h1>
            Play for your game. Give for something bigger.
          </h1>

          {/* Short description of the platform */}
          <p>
            Digital Heroes combines golf score tracking,
            monthly reward draws and charitable giving
            in one modern platform.
          </p>

          {/* Primary navigation actions */}
          <div className="actions">

            {/* Redirect users to the signup page */}
            <Link className="btn" href="/signup">
              Become a Hero
            </Link>

            {/* Redirect users to the draw information page */}
            <Link
              className="btn secondary"
              href="/draw"
            >
              How the draw works
            </Link>

          </div>
        </div>
      </section>


      {/*  KEY FEATURES SECTION
          Highlights the three main features of the platform */}

      <section className="section">
        <div className="container grid grid-3">

          {/*  FEATURE 01 - SCORE TRACKING */}

          <article className="card">
            <div className="label">
              01
            </div>

            <h3>
              Track your scores
            </h3>

            <p className="muted">
              Keep your latest five Stableford scores
              in one simple dashboard.
            </p>
          </article>


          {/*  FEATURE 02 - MONTHLY REWARDS */}

          <article className="card">
            <div className="label">
              02
            </div>

            <h3>
              Monthly rewards
            </h3>

            <p className="muted">
              Participate in monthly 3-, 4- and 5-number
              draw tiers.
            </p>
          </article>


          {/* FEATURE 03 - CHARITY*/}

          <article className="card">
            <div className="label">
              03
            </div>

            <h3>
              Give back
            </h3>

            <p className="muted">
              Direct at least 10% of your subscription
              toward a charity you choose.
            </p>
          </article>

        </div>
      </section>


      {/* MISSION SECTION
          Explains the purpose and design philosophy */}

      <section className="section">
        <div
          className="container card"
          style={{
            background: '#10221b',
            color: 'white',
          }}
        >

          {/* Mission section label */}
          <div
            className="label"
            style={{
              color: '#b8c9bd',
            }}
          >
            The mission
          </div>

          {/* Mission heading */}
          <h2
            style={{
              fontSize: 42,
              marginBottom: 8,
            }}
          >
            Feel, not fairway.
          </h2>

          {/* Mission description */}
          <p
            style={{
              maxWidth: 700,
              color: '#c6d0ca',
            }}
          >
            The experience is intentionally modern and
            emotion-led rather than a traditional golf website.
          </p>

        </div>
      </section>
    </>
  );
}
