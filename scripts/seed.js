/* eslint-env node */
import { createClient } from '@supabase/supabase-js'

// Run: node --env-file=.env.local scripts/seed.js
// Requires VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

const BASE = 'https://api.jolpi.ca/ergast/f1'
const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

// Fetches all pages of a paginated endpoint (max 100 per request on Jolpica)
async function fetchAllPages(path) {
  const limit = 100
  let offset = 0
  let all = []
  while (true) {
    const data = await fetchJson(`${BASE}/${path}?limit=${limit}&offset=${offset}`)
    const mrData = data.MRData
    const table = mrData.RaceTable ?? mrData.DriverTable
    const rows = table.Races ?? table.Drivers ?? []
    all = all.concat(rows)
    const total = parseInt(mrData.total)
    offset += limit
    if (offset >= total) break
    await sleep(300)
  }
  return all
}

// "albert_park" → "albert-park"
function toSlug(circuitId) {
  return circuitId.replace(/_/g, '-')
}

// positionText is an integer ("1".."20") for classified drivers,
// otherwise "R" (Retired), "D" (DSQ), "N" (Not classified), etc.
function parsePosition(positionText, position) {
  return /^\d+$/.test(positionText) ? parseInt(position) : null
}

async function seedSeason(season) {
  console.log(`\n=== Season ${season} ===`)

  // 1. Schedule
  const scheduleData = await fetchJson(`${BASE}/${season}.json`)
  const races = scheduleData.MRData.RaceTable.Races

  if (races.length === 0) {
    console.log(`  No races found — season skipped`)
    return { driversMap: {}, raceDriverRows: [] }
  }

  const raceRows = races.map((race, i) => ({
    season: parseInt(race.season),
    round: parseInt(race.round) || (i + 1),
    race_type: 'race',
    name: race.raceName,
    slug: toSlug(race.Circuit.circuitId),
    circuit: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
    date: race.date,
  }))

  const { data: insertedRaces, error: racesError } = await supabase
    .from('races')
    .upsert(raceRows, { onConflict: 'season,round,race_type' })
    .select('id, round')

  if (racesError) throw racesError
  console.log(`  ${insertedRaces.length} races inserted`)

  // round → uuid (main races)
  const raceMap = Object.fromEntries(insertedRaces.map((r) => [r.round, r.id]))

  await sleep(500)

  // 2. Results (grid + position + status) — paginated
  const raceResults = await fetchAllPages(`${season}/results.json`)

  const driversMap = {}
  const raceDriverRows = []

  for (const race of raceResults) {
    const raceId = raceMap[parseInt(race.round)]
    if (!raceId) continue

    for (const result of race.Results) {
      const d = result.Driver

      driversMap[d.driverId] = {
        id: d.driverId,
        given_name: d.givenName,
        family_name: d.familyName,
        nationality: d.nationality,
        date_of_birth: d.dateOfBirth ?? null,
        number: parseInt(d.permanentNumber) || null,
      }

      raceDriverRows.push({
        race_id: raceId,
        driver_id: d.driverId,
        position: parsePosition(result.positionText, result.position),
        grid_position: parseInt(result.grid) || null,
        status: result.status,
      })
    }
  }

  console.log(`  ${raceDriverRows.length} race entries collected`)

  await sleep(500)

  // 3. Sprint results
  let sprintData
  try {
    sprintData = await fetchJson(`${BASE}/${season}/sprint.json?limit=100`)
  } catch {
    sprintData = null
  }

  const sprintRaces = sprintData?.MRData?.RaceTable?.Races ?? []
  const sprintDriverRows = []

  if (sprintRaces.length > 0) {
    // Build a map of circuit info from the main schedule (by round)
    const scheduleByRound = {}
    for (const race of races) {
      scheduleByRound[parseInt(race.round)] = race
    }

    const sprintRaceRows = sprintRaces.map((sprint) => {
      const round = parseInt(sprint.round)
      const mainRace = scheduleByRound[round]
      // Jolpica returns the main race date for sprints — sprint is 1 day before
      const raceDate = new Date(sprint.date + 'T12:00:00Z')
      raceDate.setUTCDate(raceDate.getUTCDate() - 1)
      const sprintDate = raceDate.toISOString().split('T')[0]
      return {
        season: parseInt(sprint.season),
        round,
        race_type: 'sprint',
        name: (mainRace?.raceName ?? sprint.raceName).replace('Grand Prix', 'Grand Prix Sprint'),
        slug: toSlug(sprint.Circuit.circuitId) + '-sprint',
        circuit: sprint.Circuit.circuitName,
        country: sprint.Circuit.Location.country,
        date: sprintDate,
      }
    })

    const { data: insertedSprints, error: sprintError } = await supabase
      .from('races')
      .upsert(sprintRaceRows, { onConflict: 'season,round,race_type' })
      .select('id, round')

    if (sprintError) throw sprintError
    console.log(`  ${insertedSprints.length} sprints inserted`)

    const sprintMap = Object.fromEntries(insertedSprints.map((r) => [r.round, r.id]))

    for (const sprint of sprintRaces) {
      const sprintId = sprintMap[parseInt(sprint.round)]
      if (!sprintId) continue

      for (const result of sprint.SprintResults ?? []) {
        const d = result.Driver

        driversMap[d.driverId] = {
          id: d.driverId,
          given_name: d.givenName,
          family_name: d.familyName,
          nationality: d.nationality,
          date_of_birth: d.dateOfBirth ?? null,
          number: parseInt(d.permanentNumber) || null,
        }

        sprintDriverRows.push({
          race_id: sprintId,
          driver_id: d.driverId,
          position: parsePosition(result.positionText, result.position),
          grid_position: parseInt(result.grid) || null,
          status: result.status,
        })
      }
    }

    console.log(`  ${sprintDriverRows.length} sprint entries collected`)
  } else {
    console.log(`  No sprints found`)
  }

  await sleep(500)

  return { driversMap, raceDriverRows: [...raceDriverRows, ...sprintDriverRows] }
}

async function upsertInChunks(table, rows, onConflict, chunkSize = 100) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) throw error
  }
}

async function main() {
  const allDrivers = {}
  const allRaceDriverRows = []

  for (const season of SEASONS) {
    const { driversMap, raceDriverRows } = await seedSeason(season)
    Object.assign(allDrivers, driversMap)
    allRaceDriverRows.push(...raceDriverRows)
    await sleep(1000)
  }

  const driverRows = Object.values(allDrivers)
  console.log(`\nUnique drivers: ${driverRows.length}`)
  await upsertInChunks('drivers', driverRows, 'id')
  console.log('  Drivers inserted')

  console.log(`\nTotal entries: ${allRaceDriverRows.length}`)
  await upsertInChunks('race_drivers', allRaceDriverRows, 'race_id,driver_id')
  console.log('  Entries inserted')

  console.log('\nSeed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
