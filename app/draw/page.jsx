// app/draw/page.jsx

// This is the UI page for the /draw route.
// IMPORTANT:
// API logic such as POST() should NOT be written here.
// API logic belongs in: app/api/draw/route.js

export default function DrawPage() {
  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
      }}
    >
      {/* Page heading */}
      <h1>Monthly Draw</h1>

      {/* Short description */}
      <p>
        Three ways to match. Match the drawn numbers with your latest
        eligible golf scores.
      </p>

      {/* Prize information */}
      <section
        style={{
          marginTop: '30px',
          display: 'grid',
          gap: '20px',
        }}
      >
        {/* 5-number match */}
        <div>
          <h2>5-Number Match</h2>

          <p>
            <strong>40%</strong> of the prize pool
          </p>

          <p>
            If there is no 5-number winner, the jackpot rolls over
            to the next draw.
          </p>
        </div>

        {/* 4-number match */}
        <div>
          <h2>4-Number Match</h2>

          <p>
            <strong>35%</strong> of the prize pool
          </p>

          <p>
            If multiple users win this tier, the prize is shared
            equally between them.
          </p>
        </div>

        {/* 3-number match */}
        <div>
          <h2>3-Number Match</h2>

          <p>
            <strong>25%</strong> of the prize pool
          </p>

          <p>
            If multiple users win this tier, the prize is shared
            equally between them.
          </p>
        </div>
      </section>
    </main>
  );
}
