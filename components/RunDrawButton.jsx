'use client';

import { useState } from 'react';

export default function RunDrawButton() {
  // Track whether the draw is currently running
  const [loading, setLoading] = useState(false);

  // Run and publish a new draw
  const run = async () => {
    // Ask the admin for confirmation before running the draw
    if (!confirm('Run and publish a new draw?')) {
      return;
    }

    try {
      // Show loading state
      setLoading(true);

      // Call the draw API
      const response = await fetch('/api/draw', {
        method: 'POST',
      });

      // Read the API response
      const data = await response.json();

      // Show success or error message
      if (response.ok) {
        alert(
          `Draw published: ${data.numbers.join(', ')}`
        );
      } else {
        alert(data.error || 'Failed to run draw.');
      }
    } catch (error) {
      // Handle unexpected network/server errors
      console.error('Draw error:', error);
      alert('Something went wrong while running the draw.');
    } finally {
      // Stop loading state
      setLoading(false);
    }
  };

  return (
    <button
      className="btn"
      onClick={run}
      disabled={loading}
    >
      {loading ? 'Running...' : 'Run draw simulation'}
    </button>
  );
}
