/**
 * Récupère les photos des pilotes depuis Wikipedia (EN) et génère src/lib/driverPhotos.js
 * Lancer : node --env-file=.env.local scripts/fetchDriverPhotos.js
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

// Clé = titre que la fonction génèrerait naturellement (Prenom_Nom)
// Valeur = titre Wikipedia réel quand il diffère
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Récupère tous les pilotes depuis Supabase
const { data: drivers, error } = await supabase
  .from('drivers')
  .select('id, given_name, family_name')
  .order('family_name')

if (error) {
  console.error('Erreur Supabase :', error.message)
  process.exit(1)
}

console.log(`${drivers.length} pilotes à traiter…\n`)

const results = {}
const failed = []

for (const driver of drivers) {
  const title = wikiTitle(driver)
  const photo = await fetchWikiPhoto(title)

  if (photo) {
    results[driver.id] = photo
    console.log(`✓ ${driver.given_name} ${driver.family_name} → ${title}`)
  } else {
    failed.push({ id: driver.id, name: `${driver.given_name} ${driver.family_name}`, title })
    console.log(`✗ ${driver.given_name} ${driver.family_name} → introuvable (${title})`)
  }

  await sleep(200) // respecter le rate limit Wikipedia
}

// Génère src/lib/driverPhotos.js
const lines = Object.entries(results)
  .map(([id, url]) => `  '${id}': '${url}',`)
  .join('\n')

const output = `// Généré par scripts/fetchDriverPhotos.js — NE PAS ÉDITER MANUELLEMENT
// Photos pilotes depuis Wikipedia (EN) — fallback local avant mise en base

const DRIVER_PHOTOS = {
${lines}
}

export function getDriverPhoto(driver) {
  return driver.photo_url ?? DRIVER_PHOTOS[driver.id] ?? null
}
`

const outPath = join(__dirname, '../src/lib/driverPhotos.js')
writeFileSync(outPath, output, 'utf-8')

console.log(`\n✓ ${Object.keys(results).length} photos écrites dans src/lib/driverPhotos.js`)

if (failed.length > 0) {
  console.log(`\n⚠ ${failed.length} pilote(s) sans photo :`)
  failed.forEach(({ name, title }) => console.log(`  - ${name} (titre essayé : ${title})`))
  console.log('\nAjoute les titres corrects dans WIKI_OVERRIDES et relance.')
}

// Met à jour photo_url dans Supabase
console.log('\nMise à jour de photo_url dans Supabase…')
let updated = 0
for (const [driverId, photoUrl] of Object.entries(results)) {
  const { error: updateError } = await supabase
    .from('drivers')
    .update({ photo_url: photoUrl })
    .eq('id', driverId)

  if (updateError) {
    console.log(`✗ ${driverId} : ${updateError.message}`)
  } else {
    updated++
  }
}
console.log(`✓ ${updated} pilotes mis à jour dans Supabase`)
