// Generate a set of unique random numbers
export function randomNumbers(count = 5) {
  const out = [];

  // Keep generating numbers until we have the required count
  while (out.length < count) {
    // Generate a random number between 1 and 45
    const n = Math.floor(Math.random() * 45) + 1;

    // Add the number only if it is not already present
    if (!out.includes(n)) {
      out.push(n);
    }
  }

  // Return numbers in ascending order
  return out.sort((a, b) => a - b);
}


// Generate numbers based on the frequency of previous scores
export function weightedNumbers(scores, count = 5) {
  // Store how many times each score appears
  const freq = new Map();

  scores.forEach((s) => {
    freq.set(s, (freq.get(s) || 0) + 1);
  });

  // Create a pool where frequently occurring scores
  // can appear multiple times
  const pool = [...freq].flatMap(([n, f]) =>
    Array(f).fill(n)
  );

  // If there are no previous scores,
  // fall back to completely random numbers
  if (pool.length === 0) {
    return randomNumbers(count);
  }

  // Take up to the first 15 values from the weighted pool
  const top = pool.slice(0, 15);

  // Fill remaining positions with unique random numbers
  while (top.length < count) {
    const n = Math.floor(Math.random() * 45) + 1;

    if (!top.includes(n)) {
      top.push(n);
    }
  }

  // Shuffle the numbers and then return them in ascending order
  return top
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .sort((a, b) => a - b);
}


// Split the prize pool between 5-match, 4-match,
// and 3-match winners
export function prizeSplit(pool) {
  return {
    five: pool * 0.4,
    four: pool * 0.35,
    three: pool * 0.25,
  };
}
