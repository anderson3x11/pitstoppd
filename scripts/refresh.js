/**
 * Met à jour la saison en cours depuis Jolpica (calendrier, sprints, résultats, pilotes),
 * ses posters depuis TheSportsDB, puis cherche sur Wikipedia les photos des pilotes qui n'en ont pas.
 *
 *   node --disable-warning=ExperimentalWarning scripts/refresh.js
 *
 * En prod : tâche planifiée Coolify, une fois par jour.
 */

import { randomUUID } from 'node:crypto'
import { all, get, run, tx } from '../server/db.js'

const BASE = 'https://api.jolpi.ca/ergast/f1'
const TSDB = 'https://www.thesportsdb.com/api/v1/json/123' // clé publique gratuite de TheSportsDB
const CURRENT_SEASON = new Date().getFullYear()

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchJson(url, retries = 3) {
  const res = await fetch(url)
  // Trop de requêtes (clé gratuite TheSportsDB) : on attend une minute et on retente
  if (res.status === 429 && retries > 0) {
    await sleep(60_000)
    return fetchJson(url, retries - 1)
  }
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

// ─── Écriture en base ──────────────────────────────────────────────────

// Une course se retrouve par son circuit (slug), jamais par son numéro de manche : les manches
// se décalent quand le calendrier change, et le poster suit la ligne. Le slug ne change jamais
// une fois créé (il est dans les URLs) ; même circuit deux fois dans la saison → suffixe par le round.
const claimed = new Set()
function upsertRace(r) {
  const existing = all('SELECT id FROM races WHERE season = ? AND race_type = ? AND (slug = ? OR slug LIKE ?) ORDER BY rowid',
    r.season, r.race_type, r.slug, `${r.slug}-%`).find((row) => !claimed.has(row.id))
  if (existing) {
    claimed.add(existing.id)
    run('UPDATE races SET round = ?, name = ?, circuit = ?, country = ?, date = ? WHERE id = ?', r.round, r.name, r.circuit, r.country, r.date, existing.id)
    return existing.id
  }
  const slug = get('SELECT 1 FROM races WHERE season = ? AND slug = ?', r.season, r.slug) ? `${r.slug}-${r.round}` : r.slug
  const id = randomUUID()
  run('INSERT INTO races (id, season, round, race_type, name, slug, circuit, country, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, r.season, r.round, r.race_type, r.name, slug, r.circuit, r.country, r.date)
  claimed.add(id)
  return id
}

function saveResults(raceId, results) {
  for (const result of results) {
    const d = result.Driver
    run(`INSERT INTO drivers (id, given_name, family_name, nationality, date_of_birth, number) VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET given_name = excluded.given_name, family_name = excluded.family_name,
           nationality = excluded.nationality, date_of_birth = excluded.date_of_birth, number = excluded.number`,
    d.driverId, d.givenName, d.familyName, d.nationality, d.dateOfBirth ?? null, parseInt(d.permanentNumber) || null)
    run(`INSERT INTO race_drivers VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (race_id, driver_id) DO UPDATE SET position = excluded.position, grid_position = excluded.grid_position, status = excluded.status`,
    raceId, d.driverId, parsePosition(result.positionText, result.position), parseInt(result.grid) || null, result.status)
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Refresh — Season ${CURRENT_SEASON} ===\n`)

  const races = (await fetchJson(`${BASE}/${CURRENT_SEASON}.json`)).MRData.RaceTable.Races
  if (races.length === 0) return console.log('No races found for this season.')

  const base = (race) => ({
    season: parseInt(race.season),
    round: parseInt(race.round),
    circuit: race.Circuit.circuitName,
    country: race.Circuit.Location.country,
  })
  const raceMap = {}
  const sprintMap = {}
  tx(() => {
    // Manches passées en négatif le temps de les réattribuer (contrainte UNIQUE season/round/race_type)
    run('UPDATE races SET round = -round WHERE season = ?', CURRENT_SEASON)
    for (const race of races) {
      raceMap[race.round] = upsertRace({ ...base(race), race_type: 'race', name: race.raceName, slug: toSlug(race.Circuit.circuitId), date: race.date })
      // Le calendrier expose aussi les sprints à venir (contrairement à /sprint.json)
      if (race.Sprint) {
        sprintMap[race.round] = upsertRace({
          ...base(race), race_type: 'sprint',
          name: race.raceName.replace('Grand Prix', 'Grand Prix Sprint'),
          slug: toSlug(race.Circuit.circuitId) + '-sprint',
          date: race.Sprint.date,
        })
      }
    }
    // Ce qui n'est plus au calendrier officiel (course annulée, doublon) disparaît
    const removed = all('SELECT name FROM races WHERE season = ? AND round < 0', CURRENT_SEASON)
    run('DELETE FROM races WHERE season = ? AND round < 0', CURRENT_SEASON)
    for (const r of removed) console.log(`  - retiré du calendrier : ${r.name}`)
  })
  console.log(`  ${races.length} races, ${Object.keys(sprintMap).length} sprints`)

  await sleep(500)
  const raceResults = await fetchAllPages(`${CURRENT_SEASON}/results.json`)
  const sprintResults = Object.keys(sprintMap).length ? (await sleep(500), await fetchAllPages(`${CURRENT_SEASON}/sprint.json`)) : []
  tx(() => {
    // Résultats repartis de zéro pour la saison : rien ne reste accroché à une ancienne manche
    run('DELETE FROM race_drivers WHERE race_id IN (SELECT id FROM races WHERE season = ?)', CURRENT_SEASON)
    for (const race of raceResults) if (raceMap[race.round]) saveResults(raceMap[race.round], race.Results)
    for (const race of sprintResults) if (sprintMap[race.round]) saveResults(sprintMap[race.round], race.SprintResults ?? [])
  })
  console.log(`  résultats : ${raceResults.length} courses, ${sprintResults.length} sprints`)

  // Posters TheSportsDB de la saison : ils sont republiés (avec le bon numéro de manche) quand le
  // calendrier change. Date vérifiée à un jour près pour ne jamais coller le poster d'un autre GP.
  console.log('\nUpdating posters from TheSportsDB…')
  const isEventType = { race: (name) => !/Practice|Qualifying|Sprint|Testing/i.test(name), sprint: (name) => / Sprint$/.test(name) }
  let posters = 0
  try {
    for (const race of races) {
      const events = (await fetchJson(`${TSDB}/eventsround.php?id=4370&r=${race.round}&s=${CURRENT_SEASON}`)).events ?? []
      for (const [type, id, date] of [['race', raceMap[race.round], race.date], ['sprint', sprintMap[race.round], race.Sprint?.date]]) {
        const ev = id && events.find((e) => e.strPoster && isEventType[type](e.strEvent) && Math.abs(new Date(e.dateEvent) - new Date(date)) <= 864e5)
        if (ev && run('UPDATE races SET poster_url = ? WHERE id = ? AND poster_url IS NOT ?', ev.strPoster, id, ev.strPoster).changes) posters++
      }
      await sleep(2100) // clé gratuite : ~30 requêtes/min
    }
    console.log(`  ${posters} poster(s) mis à jour`)
  } catch (err) {
    console.log(`  TheSportsDB indisponible, posters inchangés (${err.message})`)
  }

  console.log('\nUpdating driver photos from Wikipedia…')
  const failed = []
  for (const driver of all('SELECT id, given_name, family_name FROM drivers WHERE photo_url IS NULL ORDER BY family_name')) {
    const title = wikiTitle(driver)
    const photo = await fetchWikiPhoto(title)
    if (photo) {
      run('UPDATE drivers SET photo_url = ? WHERE id = ?', photo, driver.id)
      console.log(`  + ${driver.given_name} ${driver.family_name}`)
    } else {
      failed.push(`${driver.given_name} ${driver.family_name} (tried: ${title})`)
    }
    await sleep(200) // rate limit Wikipedia
  }
  if (failed.length) {
    console.log(`\n  ${failed.length} driver(s) without Wikipedia photo:`)
    failed.forEach((name) => console.log(`    - ${name}`))
    console.log('  Add correct titles to WIKI_OVERRIDES and re-run.')
  }

  console.log('\nRefresh complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
