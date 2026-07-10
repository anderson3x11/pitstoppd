const BASE = 'https://api.jolpi.ca/ergast/f1'

// Cache sessionStorage : évite de re-fetcher Jolpica à chaque navigation
async function fetchJson(url) {
  const cacheKey = `jolpica:${url}`
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch { /* ignore */ }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Jolpica ${res.status} — ${url}`)
  const data = await res.json()

  try { sessionStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* quota plein — ignore */ }
  return data
}

// Toutes les courses d'une saison (calendrier)
export async function getSeasonRaces(season) {
  const data = await fetchJson(`${BASE}/${season}.json`)
  return data.MRData.RaceTable.Races
}

// Tous les pilotes d'une saison
export async function getSeasonDrivers(season) {
  const data = await fetchJson(`${BASE}/${season}/drivers.json`)
  return data.MRData.DriverTable.Drivers
}

// Résultats de toutes les courses d'une saison
export async function getSeasonResults(season) {
  const data = await fetchJson(`${BASE}/${season}/results.json?limit=1000`)
  return data.MRData.RaceTable.Races
}

// Résultats d'une course précise (par round)
export async function getRaceResults(season, round) {
  const data = await fetchJson(`${BASE}/${season}/${round}/results.json`)
  return data.MRData.RaceTable.Races[0] ?? null
}

// Résultats sprint d'un round
export async function getSprintResults(season, round) {
  const data = await fetchJson(`${BASE}/${season}/${round}/sprint.json`)
  return data.MRData.RaceTable.Races[0] ?? null
}

// Classement pilotes d'une saison
export async function getDriverStandings(season) {
  const data = await fetchJson(`${BASE}/${season}/driverStandings.json`)
  return data.MRData.StandingsTable.StandingsLists[0] ?? null
}

// Classement constructeurs d'une saison
export async function getConstructorStandings(season) {
  const data = await fetchJson(`${BASE}/${season}/constructorStandings.json`)
  return data.MRData.StandingsTable.StandingsLists[0] ?? null
}
