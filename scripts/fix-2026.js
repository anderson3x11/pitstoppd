/* eslint-env node */
// Run: node --env-file=.env.local scripts/fix-2026.js
// 1. Supprime les GPs Bahreïn et Arabie Saoudite 2026 (annulés)
// 2. Met à jour les poster_url des GPs et Sprints 2026

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY)

// Slugs des GPs annulés (et leurs éventuels sprints)
const CANCELLED_SLUGS = ['bahrain', 'bahrain-sprint', 'jeddah', 'jeddah-sprint']

// Posters 2026 — uniquement GPs et Sprints (pas les essais/qualifs)
// Clé : slug dans la DB, Valeur : poster_url TheSportsDB
const POSTERS_2026 = {
  // Round 1 — Australie
  'albert-park': 'https://r2.thesportsdb.com/images/media/event/poster/dtcf4l1773550228.jpg',
  // Round 2 — Chine
  'shanghai': 'https://r2.thesportsdb.com/images/media/event/poster/nv5ue81773550283.jpg',
  'shanghai-sprint': 'https://r2.thesportsdb.com/images/media/event/poster/2bcvvy1773550260.jpg',
  // Round 3 — Japon
  'suzuka': 'https://r2.thesportsdb.com/images/media/event/poster/k47fzn1773550337.jpg',
  // Round 4 — Miami
  'miami': 'https://r2.thesportsdb.com/images/media/event/poster/76oeah1774920036.jpg',
  'miami-sprint': 'https://r2.thesportsdb.com/images/media/event/poster/nwlkgf1774920016.jpg',
  // Round 5 — Canada
  'villeneuve': 'https://r2.thesportsdb.com/images/media/event/poster/2hzkkv1774920087.jpg',
  'villeneuve-sprint': 'https://r2.thesportsdb.com/images/media/event/poster/ek6ccx1774920066.jpg',
  // Round 6 — Monaco
  'monaco': 'https://r2.thesportsdb.com/images/media/event/poster/yngsln1774920137.jpg',
  // Round 7 — Barcelone (Catalunya)
  'catalunya': 'https://r2.thesportsdb.com/images/media/event/poster/lhxnig1774920187.jpg',
  // Round 8 — Autriche
  'red-bull-ring': 'https://r2.thesportsdb.com/images/media/event/poster/ot98eh1774920237.jpg',
  // Round 9 — Grande-Bretagne
  'silverstone': 'https://r2.thesportsdb.com/images/media/event/poster/yx2wla1774920289.jpg',
  'silverstone-sprint': 'https://r2.thesportsdb.com/images/media/event/poster/u8q59d1774920268.jpg',
  // Round 10 — Belgique
  'spa': 'https://r2.thesportsdb.com/images/media/event/poster/70nh561774920339.jpg',
  // Round 11 — Hongrie
  'hungaroring': 'https://r2.thesportsdb.com/images/media/event/poster/t29j1x1774920390.jpg',
  // Round 12 — Pays-Bas
  'zandvoort': 'https://r2.thesportsdb.com/images/media/event/poster/rgoqcy1774920439.jpg',
  'zandvoort-sprint': 'https://r2.thesportsdb.com/images/media/event/poster/9oqhzl1774920420.jpg',
  // Round 13 — Italie
  'monza': 'https://r2.thesportsdb.com/images/media/event/poster/rufsbe1774920489.jpg',
  // Round 14 — Espagne (nouveau circuit Madrid — slug Jolpica à confirmer)
  'madrid': 'https://r2.thesportsdb.com/images/media/event/poster/pn2qw61774920542.jpg',
  // Round 15 — Azerbaïdjan
  'baku': 'https://r2.thesportsdb.com/images/media/event/poster/4iku4s1774920592.jpg',
  // Round 16 — Singapour
  'marina-bay': 'https://r2.thesportsdb.com/images/media/event/poster/cpkqs31774920645.jpg',
  'marina-bay-sprint': 'https://r2.thesportsdb.com/images/media/event/poster/cyjf1o1774920625.jpg',
  // Round 17 — États-Unis
  'americas': 'https://r2.thesportsdb.com/images/media/event/poster/io8joq1774920696.jpg',
  // Round 18 — Mexique
  'rodriguez': 'https://r2.thesportsdb.com/images/media/event/poster/1mqjs81774920749.jpg',
  // Round 19 — Brésil
  'interlagos': 'https://r2.thesportsdb.com/images/media/event/poster/rdpsm61774920799.jpg',
  // Round 20 — Las Vegas
  'las-vegas': 'https://r2.thesportsdb.com/images/media/event/poster/9yor1a1774920853.jpg',
  // Round 21 — Qatar
  'losail': 'https://r2.thesportsdb.com/images/media/event/poster/ekm2231774920902.jpg',
  // Round 22 — Abu Dhabi
  'yas-marina': 'https://r2.thesportsdb.com/images/media/event/poster/24pqr61774920953.jpg',
}

async function main() {
  // 1. Lister les courses 2026 existantes
  const { data: races2026, error: listError } = await supabase
    .from('races')
    .select('id, slug, name, round, race_type')
    .eq('season', 2026)
    .order('round')

  if (listError) throw listError
  console.log(`\nCourses 2026 en base : ${races2026.length}`)
  for (const r of races2026) {
    console.log(`  Round ${r.round} [${r.race_type}] ${r.name} (slug: ${r.slug})`)
  }

  // 2. Supprimer les GPs annulés (cascade sur race_drivers via FK)
  const toDelete = races2026.filter(r => CANCELLED_SLUGS.includes(r.slug))
  if (toDelete.length === 0) {
    console.log('\nAucun GP annulé trouvé en base (Bahreïn / Arabie Saoudite).')
  } else {
    const ids = toDelete.map(r => r.id)
    console.log(`\nSuppression de ${toDelete.length} GP(s) annulé(s) :`)
    for (const r of toDelete) console.log(`  - ${r.name} (${r.slug})`)

    // Supprimer d'abord les race_drivers liés
    const { error: rdError } = await supabase
      .from('race_drivers')
      .delete()
      .in('race_id', ids)
    if (rdError) throw rdError

    // Supprimer les ratings et reviews liés
    const { error: ratError } = await supabase
      .from('ratings')
      .delete()
      .in('race_id', ids)
    if (ratError) throw ratError

    const { error: revError } = await supabase
      .from('reviews')
      .delete()
      .in('race_id', ids)
    if (revError) throw revError

    // Supprimer les courses
    const { error: delError } = await supabase
      .from('races')
      .delete()
      .in('id', ids)
    if (delError) throw delError

    console.log('  Supprimés.')
  }

  // 3. Mettre à jour les poster_url
  console.log('\nMise à jour des posters 2026...')
  let updated = 0
  let notFound = []

  for (const [slug, poster_url] of Object.entries(POSTERS_2026)) {
    const race = races2026.find(r => r.slug === slug)
    if (!race) {
      notFound.push(slug)
      continue
    }

    const { error } = await supabase
      .from('races')
      .update({ poster_url })
      .eq('id', race.id)

    if (error) throw error
    updated++
    console.log(`  ✓ ${race.name} (${slug})`)
  }

  console.log(`\n${updated} poster(s) mis à jour.`)

  if (notFound.length > 0) {
    console.log(`\nSlugs non trouvés en base (à vérifier) :`)
    for (const s of notFound) console.log(`  - ${s}`)
  }

  console.log('\nTerminé.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
