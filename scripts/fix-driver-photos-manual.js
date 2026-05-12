/* eslint-env node */
// Run: node --env-file=.env.local scripts/fix-driver-photos-manual.js
// Photos récupérées manuellement pour les pilotes ratés par fetch-driver-photos.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

const MANUAL_PHOTOS = [
  // Zhou : nom inversé (chinois), Wikipedia a "Zhou_Guanyu"
  { id: 'zhou', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Zhou_Guanyu_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A7999%29.jpg/500px-Zhou_Guanyu_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A7999%29.jpg' },
  // Timeouts lors du premier run
  { id: 'gene', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Marc_Gene_2007_Montjuic.jpg/500px-Marc_gene_2007_Montjuic.jpg' },
  { id: 'kiesa', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Nicolas_kiesa_lemans2006.jpg/500px-Nicolas_kiesa_lemans2006.jpg' },
  { id: 'merhi', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Merhi_Sepang_25.jpg/500px-Merhi_Sepang_25.jpg' },
  { id: 'montagny', url: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Franck_Montagny_Le_Mans_drivers_parade_2011_crop.jpg' },
  { id: 'pizzonia', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Fale_F1_Monza_2004_13.jpg/500px-Fale_F1_Monza_2004_13.jpg' },
  { id: 'sutil', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Adrian_Sutil.jpg/500px-Adrian_Sutil.jpg' },
  { id: 'trulli', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/12._Internationale_Sportnacht_Davos_2014_%2815246044859%29_%28cropped%29.jpg/500px-12._Internationale_Sportnacht_Davos_2014_%2815246044859%29_%28cropped%29.jpg' },
  { id: 'yamamoto', url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Sakon_Yamamoto_20220818.jpg' },
  // Justin Wilson : Wikipedia a "Justin_Wilson_(racing_driver)"
  { id: 'wilson', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Justin_Wilson_2013.jpg/500px-Justin_Wilson_2013.jpg' },
  // Mark Webber : page disambiguée "Mark_Webber_(racing_driver)", pas détectée automatiquement
  { id: 'webber', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Mark_Webber_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8720%29.jpg/500px-Mark_Webber_at_the_Melbourne_Walk_during_the_2026_Australian_Grand_Prix_%28028A8720%29.jpg' },
  // Carlos Sainz : "Carlos_Sainz" est une page de désambiguïsation, il faut "Carlos_Sainz_Jr."
  { id: 'sainz', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg/500px-Formula1Gabelhofen2022_%2804%29_%28cropped2%29.jpg' },
]

async function main() {
  for (const { id, url } of MANUAL_PHOTOS) {
    const { error } = await supabase.from('drivers').update({ photo_url: url }).eq('id', id)
    if (error) console.log(`  ✗ ${id}: ${error.message}`)
    else console.log(`  ✓ ${id}`)
  }
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
