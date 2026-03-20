/**
 * Compute the average rating from an array of scores, rounded to 1 decimal.
 * Returns null if the array is empty.
 */
export function computeAvgRating(scores) {
  if (!scores || scores.length === 0) return null
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}

/**
 * Group an array of { race_id, score } objects into a map: { [race_id]: score[] }
 */
export function groupRatingsByRace(ratings) {
  const map = {}
  for (const r of ratings ?? []) {
    if (!map[r.race_id]) map[r.race_id] = []
    map[r.race_id].push(r.score)
  }
  return map
}
