/**
 * Faux utilisateurs pour donner de la vie au site.
 *
 *   node --disable-warning=ExperimentalWarning scripts/fakeUsers.js seed
 *   node --disable-warning=ExperimentalWarning scripts/fakeUsers.js clean
 *
 * En prod (Coolify) : même commande dans le terminal du conteneur.
 * Les comptes ont un mot de passe aléatoire jeté : ils ne servent pas à se connecter.
 */

import { randomUUID, randomBytes } from 'node:crypto'
import { all, run, tx, hashPassword } from '../server/db.js'

const FAKE_EMAIL_DOMAIN = '@pitstoppd.test'

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
  {
    username: 'tifosi_roma',
    display_name: 'Tifosi Roma',
    bio: 'Forza Ferrari. Sempre e per sempre.',
    favorite_team: 'Ferrari',
    topPilotNames: ['leclerc', 'sainz', 'alonso'],
  },
  {
    username: 'orange_army',
    display_name: 'Orange Army',
    bio: 'Zandvoort is the best race weekend on the calendar. Change my mind.',
    favorite_team: 'Red Bull Racing',
    topPilotNames: ['max_verstappen', 'norris', 'leclerc'],
  },
  {
    username: 'merc_fan_2014',
    display_name: 'Merc Fan 2014',
    bio: 'Nothing will ever top the hybrid era dominance. Engineering perfection.',
    favorite_team: 'Mercedes',
    topPilotNames: ['hamilton', 'rosberg', 'russell'],
  },
  {
    username: 'backmarker_hype',
    display_name: 'Backmarker Hype',
    bio: 'I watch for Williams points and Haas chaos. Sue me.',
    favorite_team: 'Williams',
    topPilotNames: ['albon', 'hulkenberg', 'gasly'],
  },
  {
    username: 'quali_king',
    display_name: 'Quali King',
    bio: 'The race is just a formality. Qualifying is where it gets decided.',
    favorite_team: 'McLaren',
    topPilotNames: ['norris', 'leclerc', 'hamilton'],
  },
  {
    username: 'suzuka_stan',
    display_name: 'Suzuka Stan',
    bio: '130R flat. No aids. Best corner in motorsport.',
    favorite_team: 'Honda',
    topPilotNames: ['alonso', 'max_verstappen', 'norris'],
  },
  {
    username: 'vsc_deployed',
    display_name: 'VSC Deployed',
    bio: 'Virtual safety car at lap 47. Every. Single. Time.',
    favorite_team: 'Aston Martin',
    topPilotNames: ['alonso', 'stroll', 'leclerc'],
  },
  {
    username: 'race_engineer',
    display_name: 'Race Engineer',
    bio: 'Box box box. The voice in the helmet matters as much as the car.',
    favorite_team: 'Red Bull Racing',
    topPilotNames: ['max_verstappen', 'piastri', 'russell'],
  },
  {
    username: 'interlagos_rain',
    display_name: 'Interlagos Rain',
    bio: 'Brazil always delivers drama. The circuit gods are alive.',
    favorite_team: 'Ferrari',
    topPilotNames: ['leclerc', 'hamilton', 'alonso'],
  },
  {
    username: 'penalty_watch',
    display_name: 'Penalty Watch',
    bio: 'Following every stewards decision since 2010. The drama never ends.',
    favorite_team: 'Alpine',
    topPilotNames: ['gasly', 'ocon', 'alonso'],
  },
  {
    username: 'flat_out_turn1',
    display_name: 'Flat Out Turn 1',
    bio: 'Commitment to the apex. No lifting. That is the only way.',
    favorite_team: 'McLaren',
    topPilotNames: ['norris', 'piastri', 'leclerc'],
  },
  {
    username: 'parc_ferme',
    display_name: 'Parc Fermé',
    bio: 'The post-race interview is an art form and half the drivers are terrible at it.',
    favorite_team: 'Mercedes',
    topPilotNames: ['hamilton', 'alonso', 'norris'],
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

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
// Date aléatoire dans les 60 derniers jours, pour un feed qui a l'air vivant
const ago = () => `-${Math.floor(Math.random() * 60 * 24)} hours`

function seed() {
  const races = all("SELECT id FROM races WHERE date < date('now') ORDER BY date DESC LIMIT 30")
  const driverIds = new Set(all('SELECT id FROM drivers').map((d) => d.id))
  const password = hashPassword(randomBytes(16).toString('hex'))

  tx(() => {
    const users = FAKE_USERS.map((u) => {
      const id = randomUUID()
      const topPilots = u.topPilotNames.filter((name) => driverIds.has(name)).slice(0, 3)
      run(`INSERT INTO users (id, email, password_hash, username, display_name, bio, favorite_team, top_pilots, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-90 days'))`,
      id, u.username + FAKE_EMAIL_DOMAIN, password, u.username, u.display_name, u.bio, u.favorite_team,
      topPilots.length ? JSON.stringify(topPilots) : null)
      return id
    })

    // Chaque user note et critique 4 à 7 GPs
    const reviews = []
    for (const userId of users) {
      for (const race of shuffle(races).slice(0, 4 + Math.floor(Math.random() * 4))) {
        const spoiler = Math.random() < 0.2
        const id = randomUUID()
        const when = ago()
        run("INSERT INTO reviews (id, user_id, race_id, content, spoiler, created_at) VALUES (?, ?, ?, ?, ?, datetime('now', ?))",
          id, userId, race.id, randomFrom(spoiler ? SPOILER_REVIEWS : REVIEW_TEMPLATES), spoiler ? 1 : 0, when)
        run("INSERT INTO ratings (user_id, race_id, score, created_at) VALUES (?, ?, ?, datetime('now', ?))", userId, race.id, randomScore(), when)
        reviews.push({ id, userId })
      }
    }

    // Chaque user like 5 à 10 critiques des autres et suit 3 à 6 users
    for (const userId of users) {
      for (const r of shuffle(reviews.filter((r) => r.userId !== userId)).slice(0, 5 + Math.floor(Math.random() * 6))) {
        run('INSERT INTO likes VALUES (?, ?)', userId, r.id)
      }
      for (const other of shuffle(users.filter((o) => o !== userId)).slice(0, 3 + Math.floor(Math.random() * 4))) {
        run("INSERT INTO follows VALUES (?, ?, datetime('now', ?))", userId, other, ago())
      }
    }
    console.log(`${users.length} users, ${reviews.length} critiques créés`)
  })
}

function clean() {
  const { changes } = run('DELETE FROM users WHERE email LIKE ?', '%' + FAKE_EMAIL_DOMAIN) // cascade sur tout le reste
  console.log(`${changes} faux users supprimés`)
}

const cmd = process.argv[2]
if (cmd === 'seed') seed()
else if (cmd === 'clean') clean()
else console.log('Usage : node scripts/fakeUsers.js seed|clean')
