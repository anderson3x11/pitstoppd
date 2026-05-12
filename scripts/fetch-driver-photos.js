/* eslint-env node */
// Run: node --env-file=.env.local scripts/fetch-driver-photos.js
// Fetches driver portrait photos from Wikipedia and updates photo_url in DB.
// Only targets drivers without photo_url — safe to re-run.
// Add --all flag to also overwrite existing photo_url entries.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)
const overwriteAll = process.argv.includes('--all')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getWikipediaPhoto(givenName, familyName) {
  const title = `${givenName} ${familyName}`.replace(/ /g, '_')
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&redirects=1`

  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'Pitstoppd/1.0 (pitstoppd.vercel.app)' } })

    if (res.status === 429) {
      const wait = attempt * 3000
      process.stdout.write(`    → 429, retry ${attempt}/4 in ${wait / 1000}s… `)
      await sleep(wait)
      continue
    }

    if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)

    const data = await res.json()
    const pages = data.query?.pages ?? {}
    const page = Object.values(pages)[0]

    if (!page || page.pageid === -1) return null
    return page.thumbnail?.source ?? null
  }

  throw new Error('Wikipedia HTTP 429 (rate limited, max retries reached)')
}

async function main() {
  let query = supabase.from('drivers').select('id, given_name, family_name, photo_url').order('family_name')
  if (!overwriteAll) query = query.is('photo_url', null)

  const { data: drivers, error } = await query
  if (error) throw error

  console.log(`\n${drivers.length} drivers to process${overwriteAll ? ' (--all mode)' : ' (missing photo_url only)'}\n`)

  let found = 0
  let notFound = 0
  let errors = 0
  const missing = []

  for (const driver of drivers) {
    const name = `${driver.given_name} ${driver.family_name}`

    try {
      const photoUrl = await getWikipediaPhoto(driver.given_name, driver.family_name)

      if (photoUrl) {
        const { error: updateError } = await supabase
          .from('drivers')
          .update({ photo_url: photoUrl })
          .eq('id', driver.id)

        if (updateError) {
          console.log(`  ✗ ${name} — DB error: ${updateError.message}`)
          errors++
        } else {
          console.log(`  ✓ ${name}`)
          found++
        }
      } else {
        console.log(`  ? ${name} — no photo on Wikipedia`)
        notFound++
        missing.push({ id: driver.id, name })
      }
    } catch (err) {
      console.log(`  ! ${name} — fetch error: ${err.message}`)
      errors++
    }

    await sleep(600)
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✓  Updated  : ${found}`)
  console.log(`?  No photo : ${notFound}`)
  if (errors > 0) console.log(`✗  Errors   : ${errors}`)

  if (missing.length > 0) {
    console.log(`\nDrivers without Wikipedia photo (manual lookup needed):`)
    for (const d of missing) console.log(`  - ${d.id} | ${d.name}`)
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
