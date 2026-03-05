import { createClient } from '@supabase/supabase-js'

// Lancer avec : node --env-file=.env.local scripts/seed.js
// Nécessite VITE_SUPABASE_URL et SUPABASE_SECRET_KEY dans .env.local

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Manque VITE_SUPABASE_URL ou SUPABASE_SECRET_KEY dans .env.local')
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

// Récupère toutes les pages d'un endpoint paginé (limit 100 max par Jolpica)
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

// positionText est un entier ("1".."20") pour les pilotes classés,
// sinon "R" (Retired), "D" (DSQ), "N" (Non classé), etc.
function parsePosition(positionText, position) {
  return /^\d+$/.test(positionText) ? parseInt(position) : null
}

async function seedSeason(season) {
  console.log(`\n=== Saison ${season} ===`)

  // 1. Calendrier
  const scheduleData = await fetchJson(`${BASE}/${season}.json`)
  const races = scheduleData.MRData.RaceTable.Races

  if (races.length === 0) {
    console.log(`  Aucune course trouvée — saison ignorée`)
    return { driversMap: {}, raceDriverRows: [] }
  }

  const raceRows = races.map((race) => ({
    season: parseInt(race.season),
    round: parseInt(race.round),
    name: race.raceName,
    slug: toSlug(race.Circuit.circuitId),
    circuit: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
    date: race.date,
  }))

  const { data: insertedRaces, error: racesError } = await supabase
    .from('races')
    .upsert(raceRows, { onConflict: 'season,round' })
    .select('id, round')

  if (racesError) throw racesError
  console.log(`  ${insertedRaces.length} courses insérées`)

  // round → uuid
  const raceMap = Object.fromEntries(insertedRaces.map((r) => [r.round, r.id]))

  await sleep(500)

  // 2. Résultats (grid + position + status) — paginé
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

  console.log(`  ${raceDriverRows.length} participations collectées`)

  await sleep(500)

  return { driversMap, raceDriverRows }
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
  console.log(`\nPilotes uniques : ${driverRows.length}`)
  await upsertInChunks('drivers', driverRows, 'id')
  console.log('  Pilotes insérés')

  console.log(`\nParticipations totales : ${allRaceDriverRows.length}`)
  await upsertInChunks('race_drivers', allRaceDriverRows, 'race_id,driver_id')
  console.log('  Participations insérées')

  console.log('\nSeed terminé.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
