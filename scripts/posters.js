/* eslint-env node */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

// Keywords identifying non-race sessions (Practice, Qualifying, Tests...)
const EXCLUDE = /Practice|Qualifying|Test|Shootout/i

// Parse a simple CSV (no internal commas in values)
// Expected columns: idEvent, dateEvent, Round, strEvent, strPoster, strThumb
function parseCsv(content) {
  const lines = content.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    return {
      date:   (cols[1] ?? '').trim(),
      name:   (cols[3] ?? '').trim(),
      poster: (cols[4] ?? '').trim(),
    }
  })
}

const postersDir = join(__dirname, 'posters')
const files = readdirSync(postersDir).filter((f) => f.endsWith('.csv'))

let total = 0
let errors = 0

for (const file of files.sort()) {
  const season = parseInt(file.replace('.csv', ''))
  if (isNaN(season)) continue

  const content = readFileSync(join(postersDir, file), 'utf-8')
  const rows = parseCsv(content)

  // Keep only race + sprint rows (not Practice/Qualifying/Test...)
  // that have a poster URL
  const gpRows = rows.filter((r) => r.poster && !EXCLUDE.test(r.name))

  if (gpRows.length === 0) {
    console.log(`${season}: no data`)
    continue
  }

  console.log(`${season}: ${gpRows.length} GPs found`)

  for (const row of gpRows) {
    if (!row.date) {
      console.warn(`  ⚠ Missing date: ${row.name}`)
      continue
    }

    // Match by date + race_type
    const isSprint = /Sprint$/i.test(row.name)
    const { error } = await supabase
      .from('races')
      .update({ poster_url: row.poster })
      .eq('date', row.date)
      .eq('race_type', isSprint ? 'sprint' : 'race')

    if (error) {
      console.error(`  ✗ ${row.date} ${row.name} — ${error.message}`)
      errors++
    } else {
      console.log(`  ✓ ${row.date} — ${row.name}`)
      total++
    }
  }
}

console.log(`\nDone: ${total} updated, ${errors} error(s)`)
