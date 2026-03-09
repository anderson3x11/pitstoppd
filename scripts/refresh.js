/* eslint-env node */
/**
 * Refresh script — updates the current F1 season data and driver photos.
 *
 * Updates races, drivers, and race_drivers for the current year,
 * then fetches Wikipedia photos for any driver missing a photo_url.
 *
 * Run: node --env-file=.env.local scripts/refresh.js
 * Requires VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

const BASE = 'https://api.jolpi.ca/ergast/f1'
const CURRENT_SEASON = new Date().getFullYear()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

// Fetch all pages of a paginated Jolpica endpoint (max 100 per page)
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

async function upsertInChunks(table, rows, onConflict, chunkSize = 100) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) throw error
  }
}

// ─── Wikipedia driver photos ───────────────────────────────────────────

const WIKI_OVERRIDES = {
  'George_Russell':         'George_Russell_(racing_driver)',
  'Carlos_Sainz':           'Carlos_Sainz_Jr.',
  'Sergio_Perez':           'Sergio_Pérez',
  'Nyck_De_Vries':          'Nyck_de_Vries',
  'Theo_Pourchaire':        'Théo_Pourchaire',
  'Andrea_Kimi_Antonelli':  'Kimi_Antonelli',
}

function wikiTitle(driver) {
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const defaultTitle = `${capitalize(driver.given_name)}_${capitalize(driver.family_name)}`
  return WIKI_OVERRIDES[defaultTitle] ?? defaultTitle
}

async function fetchWikiPhoto(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Pitstoppd/1.0 (portfolio project; contact via GitHub)' }
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.originalimage?.source ?? data.thumbnail?.source ?? null
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Refresh — Season ${CURRENT_SEASON} ===\n`)

  // 1. Fetch current season schedule
  console.log('Fetching schedule…')
  const scheduleData = await fetchJson(`${BASE}/${CURRENT_SEASON}.json`)
  const races = scheduleData.MRData.RaceTable.Races

  if (races.length === 0) {
    console.log('No races found for this season.')
    return
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

  // 2. Upsert races
  const { data: upsertedRaces, error: racesError } = await supabase
    .from('races')
    .upsert(raceRows, { onConflict: 'season,round' })
    .select('id, round')

  if (racesError) throw racesError
  console.log(`  ${upsertedRaces.length} races upserted`)

  const raceMap = Object.fromEntries(upsertedRaces.map((r) => [r.round, r.id]))

  await sleep(500)

  // 3. Fetch current season results (paginated)
  console.log('Fetching results…')
  const raceResults = await fetchAllPages(`${CURRENT_SEASON}/results.json`)

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

  // 4. Upsert drivers
  const driverRows = Object.values(driversMap)
  if (driverRows.length > 0) {
    await upsertInChunks('drivers', driverRows, 'id')
    console.log(`  ${driverRows.length} drivers upserted`)
  } else {
    console.log('  No results yet for this season')
  }

  // 5. Upsert race_drivers
  if (raceDriverRows.length > 0) {
    await upsertInChunks('race_drivers', raceDriverRows, 'race_id,driver_id')
    console.log(`  ${raceDriverRows.length} race_drivers upserted`)
  }

  // 6. Fetch Wikipedia photos for drivers with no photo_url
  console.log('\nUpdating driver photos from Wikipedia…')

  const { data: driversNoPhoto, error: photoQueryError } = await supabase
    .from('drivers')
    .select('id, given_name, family_name')
    .is('photo_url', null)
    .order('family_name')

  if (photoQueryError) throw photoQueryError

  if (driversNoPhoto.length === 0) {
    console.log('  All drivers already have photos')
  } else {
    console.log(`  ${driversNoPhoto.length} drivers without photo_url`)

    let updated = 0
    const failed = []

    for (const driver of driversNoPhoto) {
      const title = wikiTitle(driver)
      const photo = await fetchWikiPhoto(title)

      if (photo) {
        const { error: updateError } = await supabase
          .from('drivers')
          .update({ photo_url: photo })
          .eq('id', driver.id)

        if (updateError) {
          console.log(`  x ${driver.given_name} ${driver.family_name}: ${updateError.message}`)
        } else {
          updated++
          console.log(`  + ${driver.given_name} ${driver.family_name}`)
        }
      } else {
        failed.push(`${driver.given_name} ${driver.family_name} (tried: ${title})`)
      }

      await sleep(200) // rate limit Wikipedia
    }

    console.log(`  ${updated} photo(s) updated in Supabase`)

    if (failed.length > 0) {
      console.log(`\n  ${failed.length} driver(s) without Wikipedia photo:`)
      failed.forEach((name) => console.log(`    - ${name}`))
      console.log('  Add correct titles to WIKI_OVERRIDES and re-run.')
    }
  }

  console.log('\nRefresh complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
