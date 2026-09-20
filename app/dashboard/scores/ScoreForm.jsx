"use client";
import toast from 'react-hot-toast';
import { useState } from "react";

export default function ScoreForm() {
  const [date, setDate] = useState("");
  const [score, setScore] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    setMsg("");
    setError("");

    try {
      const r = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          score: Number(score),
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        toast.error(
          d.error || 'Failed to save score.'
        );

        return;
      }

      toast.success('Score saved successfully!');

      setDate('');
      setScore('');

      // Refresh the page after showing the toast.
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    } catch (err) {
      console.error(err);

      toast.error(
        'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <form className="score-card" onSubmit={submit}>
      <div className="score-header">
        <div>
          <h3>Add score</h3>
          <p>Enter the date of your round and your Stableford score.</p>
        </div>
      </div>

      {error && <div className="score-error">{error}</div>}

      {msg && <div className="score-success">{msg}</div>}

      <div className="score-fields">
        {/* Date */}
        <div className="score-field">
          <label htmlFor="score-date">
            <span>Date</span>
          </label>

          <div className="input-wrapper">
            <span className="input-icon">📅</span>

            <input
              id="score-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <small>Select the date you played</small>
        </div>

        {/* Stableford Score */}
        <div className="score-field">
          <label htmlFor="stableford-score">
            <span>Stableford score</span>
          </label>

          <div className="input-wrapper">
            <span className="input-icon">🏆</span>

            <input
              id="stableford-score"
              type="number"
              min="1"
              max="45"
              placeholder="e.g. 36"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required
            />
          </div>

          <small>Enter a score between 1 and 45</small>
        </div>
      </div>

      <button className="save-score-btn" type="submit">
        <span>🏆</span>
        Save score
      </button>
    </form>
  );
}
