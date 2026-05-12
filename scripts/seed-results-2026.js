/* eslint-env node */
// Run: node --env-file=.env.local scripts/seed-results-2026.js
// Fetches 2026 race results from Jolpica and upserts race_drivers only.
// Safe to re-run — uses upsert.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
const BASE = 'https://api.jolpi.ca/ergast/f1'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

function parsePosition(positionText, position) {
  return /^\d+$/.test(positionText) ? parseInt(position) : null
}

async function main() {
  // 1. Fetch all 2026 races from DB
  const { data: races, error } = await supabase
    .from('races')
    .select('id, round, slug, race_type, name')
    .eq('season', 2026)
    .order('round')

  if (error) throw error
  console.log(`${races.length} races found in DB for 2026`)

  const raceMap = {}
  const sprintMap = {}
  for (const r of races) {
    if (r.race_type === 'race') raceMap[r.round] = r
    else if (r.race_type === 'sprint') sprintMap[r.round] = r
  }

  // 2. Fetch race results from Jolpica
  console.log('\nFetching 2026 race results...')
  const resultsData = await fetchJson(`${BASE}/2026/results.json?limit=100`)
  const raceResults = resultsData.MRData.RaceTable.Races ?? []
  console.log(`  ${raceResults.length} races with results from Jolpica`)

  const driversMap = {}
  const raceDriverRows = []

  for (const race of raceResults) {
    const round = parseInt(race.round)
    const dbRace = raceMap[round]
    if (!dbRace) {
      console.log(`  Round ${round}: not found in DB, skipping`)
      continue
    }

    console.log(`  Round ${round}: ${dbRace.name} (${race.Results.length} drivers)`)
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
        race_id: dbRace.id,
        driver_id: d.driverId,
        position: parsePosition(result.positionText, result.position),
        grid_position: parseInt(result.grid) || null,
        status: result.status,
      })
    }
  }

  await sleep(500)

  // 3. Fetch sprint results from Jolpica
  console.log('\nFetching 2026 sprint results...')
  let sprintData
  try {
    sprintData = await fetchJson(`${BASE}/2026/sprint.json?limit=100`)
  } catch {
    sprintData = null
  }

  const sprintResults = sprintData?.MRData?.RaceTable?.Races ?? []
  console.log(`  ${sprintResults.length} sprints with results from Jolpica`)

  for (const sprint of sprintResults) {
    const round = parseInt(sprint.round)
    const dbSprint = sprintMap[round]
    if (!dbSprint) {
      console.log(`  Round ${round} sprint: not found in DB, skipping`)
      continue
    }

    console.log(`  Round ${round} sprint: ${dbSprint.name} (${sprint.SprintResults?.length ?? 0} drivers)`)
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
      raceDriverRows.push({
        race_id: dbSprint.id,
        driver_id: d.driverId,
        position: parsePosition(result.positionText, result.position),
        grid_position: parseInt(result.grid) || null,
        status: result.status,
      })
    }
  }

  if (raceDriverRows.length === 0) {
    console.log('\nNo results to insert. Jolpica may not have 2026 results yet.')
    return
  }

  // 4. Upsert drivers
  const driverRows = Object.values(driversMap)
  console.log(`\nUpserting ${driverRows.length} drivers...`)
  for (let i = 0; i < driverRows.length; i += 100) {
    const { error } = await supabase.from('drivers').upsert(driverRows.slice(i, i + 100), { onConflict: 'id' })
    if (error) throw error
  }
  console.log('  Done.')

  // 5. Upsert race_drivers
  console.log(`\nUpserting ${raceDriverRows.length} race_driver entries...`)
  for (let i = 0; i < raceDriverRows.length; i += 100) {
    const { error } = await supabase.from('race_drivers').upsert(raceDriverRows.slice(i, i + 100), { onConflict: 'race_id,driver_id' })
    if (error) throw error
  }
  console.log('  Done.')

  console.log('\nFinished.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
