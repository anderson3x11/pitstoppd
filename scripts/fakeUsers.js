/* eslint-env node */
/**
 * Fake users script — seed/clean fake test data.
 *
 * Run:
 *   node --env-file=.env.local scripts/fakeUsers.js seed
 *   node --env-file=.env.local scripts/fakeUsers.js clean
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const FAKE_EMAIL_DOMAIN = '@pitstoppd.test'
const FAKE_PASSWORD = 'Pitstoppd2026!'

// ─── Fake user definitions ─────────────────────────────────────────────

const FAKE_USERS = [
  {
    username: 'luca_scuderia',
    display_name: 'Luca Scuderia',
    bio: 'Tifosi since birth. Ferrari or nothing.',
    favorite_team: 'Ferrari',
    topPilotNames: ['leclerc', 'sainz', 'hamilton'],
  },
  {
    username: 'max_fanboy',
    display_name: 'Max Fanboy',
    bio: 'Dutch pride. The GOAT is already here.',
    favorite_team: 'Red Bull Racing',
    topPilotNames: ['max_verstappen', 'norris', 'piastri'],
  },
  {
    username: 'brit_f1',
    display_name: 'Brit F1',
    bio: 'Silverstone is the best circuit, not up for debate.',
    favorite_team: 'McLaren',
    topPilotNames: ['norris', 'piastri', 'russell'],
  },
  {
    username: 'paddock_insider',
    display_name: 'Paddock Insider',
    bio: 'Following F1 since Schumacher era. Seen it all.',
    favorite_team: 'Mercedes',
    topPilotNames: ['hamilton', 'russell', 'leclerc'],
  },
  {
    username: 'f1_purist',
    display_name: 'F1 Purist',
    bio: 'V10s forever. Current F1 is still great though.',
    favorite_team: 'Williams',
    topPilotNames: ['alonso', 'vettel', 'hamilton'],
  },
  {
    username: 'speedfreak99',
    display_name: 'Speedfreak',
    bio: 'Monza high speed forever. Low downforce gang.',
    favorite_team: 'McLaren',
    topPilotNames: ['norris', 'max_verstappen', 'piastri'],
  },
  {
    username: 'overtaker_mode',
    display_name: 'Overtaker',
    bio: 'Only here for the on-track action. DRS hater.',
    favorite_team: 'Aston Martin',
    topPilotNames: ['alonso', 'leclerc', 'norris'],
  },
  {
    username: 'podium_watch',
    display_name: 'Podium Watch',
    bio: 'Rating every race since 2020. Someone has to.',
    favorite_team: 'Red Bull Racing',
    topPilotNames: ['max_verstappen', 'leclerc', 'hamilton'],
  },
  {
    username: 'monaco_lover',
    display_name: 'Monaco Lover',
    bio: 'If it doesnt go through the tunnel, is it even racing?',
    favorite_team: 'Ferrari',
    topPilotNames: ['leclerc', 'alonso', 'norris'],
  },
  {
    username: 'safety_car_fan',
    display_name: 'Safety Car Fan',
    bio: 'Nothing beats a late safety car shaking things up.',
    favorite_team: 'Haas',
    topPilotNames: ['hulkenberg', 'magnussen', 'alonso'],
  },
  {
    username: 'pit_strategy',
    display_name: 'Pit Strategy',
    bio: 'Undercut or overcut? I will tell you which was correct after lap 20.',
    favorite_team: 'McLaren',
    topPilotNames: ['norris', 'piastri', 'leclerc'],
  },
  {
    username: 'sector_three',
    display_name: 'Sector Three',
    bio: 'The last sector tells you everything about a qualifying lap.',
    favorite_team: 'Mercedes',
    topPilotNames: ['hamilton', 'russell', 'norris'],
  },
  {
    username: 'gravel_trap',
    display_name: 'Gravel Trap',
    bio: 'Bring back gravel traps. Grass too. Get rid of the tarmac runoffs.',
    favorite_team: 'Alpine',
    topPilotNames: ['alonso', 'ocon', 'gasly'],
  },
  {
    username: 'drs_hater',
    display_name: 'DRS Hater',
    bio: 'Artificial overtaking is not real racing. Fight me.',
    favorite_team: 'Aston Martin',
    topPilotNames: ['alonso', 'stroll', 'vettel'],
  },
  {
    username: 'wetweather_god',
    display_name: 'Wet Weather',
    bio: 'Intermediate tyres, full wets, chaos. Best conditions in motorsport.',
    favorite_team: 'Ferrari',
    topPilotNames: ['leclerc', 'hamilton', 'alonso'],
  },
  {
    username: 'tech_directive',
    display_name: 'Tech Directive',
    bio: 'I read the technical regulations for fun. Floor stays, porpoising was overrated.',
    favorite_team: 'Red Bull Racing',
    topPilotNames: ['max_verstappen', 'russell', 'piastri'],
  },
  {
    username: 'laptime_nerd',
    display_name: 'Laptime Nerd',
    bio: 'Sector times, tyre deg, fuel loads. I watch every session.',
    favorite_team: 'McLaren',
    topPilotNames: ['norris', 'max_verstappen', 'hamilton'],
  },
]

// ─── Review content pool ───────────────────────────────────────────────

const REVIEW_TEMPLATES = [
  'Absolutely brilliant race. The strategy calls were spot on and the overtakes were genuinely exciting. One of the best this season.',
  'Underwhelming honestly. The pace difference between the top teams was way too big. Hoped for more from the midfield.',
  'Classic street circuit chaos. Three safety cars, two retirements and a surprise podium — exactly what F1 should be.',
  'The weather made this one special. When it starts raining at lap 30 everything becomes unpredictable and I love it.',
  'Boring processional race unfortunately. Once the top 3 pulled away there was nothing to watch. Circuit needs a rethink.',
  'Incredible atmosphere even on TV. The crowd energy at this track is unmatched. Race itself was decent with some good battles.',
  'Controversial stewarding decisions completely ruined what was shaping up to be a great race. Frustrating to watch.',
  'Strategy chaos in the best possible way. Three different tyre compounds in play and nobody knowing the right call.',
  'Loved it. Old school circuit, real racing, no DRS needed to overtake. More of this please.',
  'Solid race but nothing extraordinary. The front runners were too far ahead from lap 5. Points for effort though.',
  'Incredible opening lap drama. Three positions changed in the first corner alone. Set the tone for the whole race.',
  'Expected more from the home crowd favourite but the car simply was not there this weekend. Still a great spectacle.',
  'Lights to flag for the leader but the midfield battles were genuinely thrilling. Always something happening in the background.',
  'The team radio moments made this race iconic. Pressure, strategy and some questionable decisions from the pit wall.',
  'One of those races where anything can happen and it did. Retirements, safety cars, fast cars starting from the back.',
]

const SPOILER_REVIEWS = [
  'Could not believe the last lap drama. The leader ran out of fuel on the final straight — unbelievable scenes.',
  'The late red flag completely changed the race outcome. Controversial call but the restart was electric.',
  'Fastest lap on the final tour to snatch the extra point. Every single point matters in this championship.',
]

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomScore() {
  const scores = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
  const weights = [1, 2, 3, 5, 8, 12, 10, 6]
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < scores.length; i++) {
    r -= weights[i]
    if (r <= 0) return scores[i]
  }
  return 4
}

// ─── Seed ──────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n=== Seeding fake users ===\n')

  // 1. Fetch past races only
  const today = new Date().toISOString().split('T')[0]
  const { data: races, error: racesErr } = await supabase
    .from('races')
    .select('id, name, season')
    .lt('date', today)
    .order('date', { ascending: false })
    .limit(30)
  if (racesErr) throw racesErr
  console.log(`Fetched ${races.length} races to review`)

  // 2. Fetch drivers to resolve top pilot names → IDs
  const { data: drivers, error: driversErr } = await supabase
    .from('drivers')
    .select('id, family_name')
  if (driversErr) throw driversErr
  const driverMap = Object.fromEntries(drivers.map((d) => [d.id, d]))

  // 3. Create auth users + profiles
  const createdUsers = []

  for (const u of FAKE_USERS) {
    const email = `${u.username}${FAKE_EMAIL_DOMAIN}`
    console.log(`Creating user ${u.username}…`)

    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: FAKE_PASSWORD,
      email_confirm: true,
      user_metadata: { username: u.username, display_name: u.display_name },
    })
    if (authErr) {
      console.error(`  x Auth error: ${authErr.message}`)
      continue
    }

    const userId = authData.user.id

    // Resolve top pilot IDs
    const topPilots = u.topPilotNames
      .map((name) => driverMap[name]?.id ?? null)
      .filter(Boolean)
      .slice(0, 3)

    // Upsert profile (may already exist from trigger)
    const { error: profileErr } = await supabase.from('profiles').upsert({
      id: userId,
      username: u.username,
      display_name: u.display_name,
      bio: u.bio,
      favorite_team: u.favorite_team,
      top_pilots: topPilots.length > 0 ? topPilots : null,
    }, { onConflict: 'id' })

    if (profileErr) {
      console.error(`  x Profile error: ${profileErr.message}`)
      continue
    }

    createdUsers.push({ ...u, id: userId, email })
    console.log(`  ✓ ${u.username} (${userId.slice(0, 8)}…)`)
  }

  console.log(`\n${createdUsers.length} users created`)

  // 4. Create reviews + ratings
  console.log('\nCreating reviews and ratings…')
  const allReviews = []

  for (const u of createdUsers) {
    // Each user reviews 4–7 random races
    const count = 4 + Math.floor(Math.random() * 4)
    const shuffled = [...races].sort(() => Math.random() - 0.5).slice(0, count)

    for (const race of shuffled) {
      const isSpoiler = Math.random() < 0.2
      const content = isSpoiler ? randomFrom(SPOILER_REVIEWS) : randomFrom(REVIEW_TEMPLATES)

      const { data: review, error: reviewErr } = await supabase
        .from('reviews')
        .insert({ user_id: u.id, race_id: race.id, content, spoiler: isSpoiler })
        .select('id')
        .single()

      if (reviewErr) {
        console.error(`  x Review error (${u.username}/${race.name}): ${reviewErr.message}`)
        continue
      }

      allReviews.push({ id: review.id, user_id: u.id, race_id: race.id })

      // Rating for that race
      const score = randomScore()
      const { error: ratingErr } = await supabase
        .from('ratings')
        .insert({ user_id: u.id, race_id: race.id, score })

      if (ratingErr) {
        console.error(`  x Rating error: ${ratingErr.message}`)
      }
    }
    console.log(`  ✓ ${u.username} — ${count} reviews`)
  }

  // 5. Create likes (each user likes 5–10 reviews from others)
  console.log('\nCreating likes…')
  let likeCount = 0

  for (const u of createdUsers) {
    const othersReviews = allReviews.filter((r) => r.user_id !== u.id)
    const tolike = othersReviews.sort(() => Math.random() - 0.5).slice(0, 5 + Math.floor(Math.random() * 6))

    for (const review of tolike) {
      const { error } = await supabase
        .from('likes')
        .insert({ user_id: u.id, review_id: review.id })

      if (!error) likeCount++
    }
  }
  console.log(`  ✓ ${likeCount} likes created`)

  // 6. Create follows (each user follows 3–6 others)
  console.log('\nCreating follows…')
  let followCount = 0

  for (const u of createdUsers) {
    const others = createdUsers.filter((other) => other.id !== u.id)
    const toFollow = others.sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 4))

    for (const other of toFollow) {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: u.id, following_id: other.id })

      if (!error) followCount++
    }
  }
  console.log(`  ✓ ${followCount} follows created`)

  console.log('\n=== Seed complete ===')
  console.log(`Users: ${createdUsers.length} | Reviews: ${allReviews.length} | Likes: ${likeCount} | Follows: ${followCount}`)
  console.log('\nTo clean up: node --env-file=.env.local scripts/fakeUsers.js clean')
}

// ─── Clean ─────────────────────────────────────────────────────────────

async function clean() {
  console.log('\n=== Cleaning fake users ===\n')

  // Find all fake auth users by email domain
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) throw listErr

  const fakeUsers = users.filter((u) => u.email?.endsWith(FAKE_EMAIL_DOMAIN))
  console.log(`Found ${fakeUsers.length} fake users`)

  if (fakeUsers.length === 0) {
    console.log('Nothing to clean.')
    return
  }

  const fakeIds = fakeUsers.map((u) => u.id)

  // Delete in dependency order
  console.log('Deleting likes…')
  for (const id of fakeIds) {
    await supabase.from('likes').delete().eq('user_id', id)
  }

  // Also delete likes ON fake users' reviews
  const { data: fakeReviews } = await supabase
    .from('reviews')
    .select('id')
    .in('user_id', fakeIds)

  if (fakeReviews?.length) {
    const reviewIds = fakeReviews.map((r) => r.id)
    await supabase.from('likes').delete().in('review_id', reviewIds)
  }

  console.log('Deleting ratings…')
  for (const id of fakeIds) {
    await supabase.from('ratings').delete().eq('user_id', id)
  }

  console.log('Deleting reviews…')
  for (const id of fakeIds) {
    await supabase.from('reviews').delete().eq('user_id', id)
  }

  console.log('Deleting follows…')
  for (const id of fakeIds) {
    await supabase.from('follows').delete().eq('follower_id', id)
    await supabase.from('follows').delete().eq('following_id', id)
  }

  console.log('Deleting profiles…')
  for (const id of fakeIds) {
    await supabase.from('profiles').delete().eq('id', id)
  }

  console.log('Deleting auth users…')
  for (const u of fakeUsers) {
    const { error } = await supabase.auth.admin.deleteUser(u.id)
    if (error) console.error(`  x ${u.email}: ${error.message}`)
    else console.log(`  ✓ ${u.email}`)
  }

  console.log('\n=== Clean complete ===')
}

// ─── Entry point ───────────────────────────────────────────────────────

const command = process.argv[2]

if (command === 'seed') {
  seed().catch((err) => { console.error(err); process.exit(1) })
} else if (command === 'clean') {
  clean().catch((err) => { console.error(err); process.exit(1) })
} else {
  console.error('Usage: node --env-file=.env.local scripts/fakeUsers.js [seed|clean]')
  process.exit(1)
}
