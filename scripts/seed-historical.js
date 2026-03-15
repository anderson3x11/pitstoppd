/* eslint-env node */
import { createClient } from '@supabase/supabase-js'

// Run: node --env-file=.env.local scripts/seed-historical.js
// Seeds seasons 2000–2019 (no sprints existed before 2021)

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

const BASE = 'https://api.jolpi.ca/ergast/f1'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url)
    if (res.status === 429) {
      const wait = Math.min(2000 * 2 ** attempt, 60000)
      console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s (attempt ${attempt + 1}/${retries + 1})…`)
      await sleep(wait)
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
    return res.json()
  }
  throw new Error(`Too many 429s — ${url}`)
}

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
    await sleep(1000)
  }
  return all
}

function toSlug(circuitId) {
  return circuitId.replace(/_/g, '-')
}

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

  const raceMap = Object.fromEntries(insertedRaces.map((r) => [r.round, r.id]))

  await sleep(1500)

  // 2. Results — paginated
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

  // Insert drivers + race_drivers immediately per season (don't wait until end)
  const driverRows = Object.values(driversMap)
  await upsertInChunks('drivers', driverRows, 'id')
  console.log(`  ${driverRows.length} drivers upserted`)

  await upsertInChunks('race_drivers', raceDriverRows, 'race_id,driver_id')
  console.log(`  ${raceDriverRows.length} race_drivers upserted`)

  await sleep(1000)
}

async function upsertInChunks(table, rows, onConflict, chunkSize = 100) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) throw error
  }
}

async function main() {
  // Optional: node --env-file=.env.local scripts/seed-historical.js 2017
  // to resume from a specific season
  const startFrom = parseInt(process.argv[2]) || 2000
  const seasons = []
  for (let y = startFrom; y <= 2019; y++) seasons.push(y)
  console.log(`Seeding seasons ${seasons[0]}–${seasons[seasons.length - 1]}…`)

  for (const season of seasons) {
    await seedSeason(season)
    await sleep(1500)
  }

  console.log('\nHistorical seed complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
