import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { randomUUID, randomBytes } from 'node:crypto'
import { writeFileSync, unlinkSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { all, get, run, DATA_DIR, hashPassword, checkPassword } from './db.js'

const USERNAME_RE = /^[a-z0-9_-]{3,20}$/
const SESSION_DAYS = 30
const PAST = `date < date('now')`

// ── Auth ────────────────────────────────────────────────────────────────

const PROFILE_COLS = 'id, username, display_name, bio, avatar_url, favorite_team, top_pilots'
const toProfile = (u) => u && { ...u, top_pilots: u.top_pilots ? JSON.parse(u.top_pilots) : null }

function startSession(c, userId) {
  const token = randomBytes(32).toString('hex')
  run('INSERT INTO sessions VALUES (?, ?, ?)', token, userId, Date.now() + SESSION_DAYS * 864e5)
  setCookie(c, 'sid', token, {
    httpOnly: true, sameSite: 'Lax', path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 86400,
  })
}

const app = new Hono()
const api = new Hono()

// Résout l'utilisateur courant (ou null) pour toutes les routes
api.use(async (c, next) => {
  const sid = getCookie(c, 'sid')
  const session = sid && get('SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?', sid, Date.now())
  c.set('user', session ? toProfile(get(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, session.user_id)) : null)
  await next()
})

const requireUser = async (c, next) => {
  if (!c.get('user')) return c.json({ error: 'Not signed in.' }, 401)
  await next()
}

const bad = (c, error, field) => c.json({ error, field }, 400)
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

api.get('/me', (c) => c.json(c.get('user')))

api.post('/auth/register', async (c) => {
  const b = await c.req.json()
  const email = str(b.email, 254).toLowerCase()
  const username = str(b.username, 20)
  const displayName = str(b.display_name, 50)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(c, 'Invalid email.', 'email')
  if (!USERNAME_RE.test(username)) return bad(c, '3 to 20 characters: lowercase letters, digits, - or _', 'username')
  if (!displayName) return bad(c, 'Display name is required.', 'displayName')
  if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 200) return bad(c, '8 characters minimum.', 'password')
  if (get('SELECT 1 FROM users WHERE username = ?', username)) return bad(c, 'This username is already taken.', 'username')
  if (get('SELECT 1 FROM users WHERE email = ?', email)) return bad(c, 'An account already exists with this email.', 'email')

  const id = randomUUID()
  run('INSERT INTO users (id, email, password_hash, username, display_name) VALUES (?, ?, ?, ?, ?)', id, email, hashPassword(b.password), username, displayName)
  startSession(c, id)
  return c.json(toProfile(get(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, id)))
})

api.post('/auth/login', async (c) => {
  const b = await c.req.json()
  const u = get('SELECT id, password_hash FROM users WHERE email = ?', str(b.email, 254).toLowerCase())
  if (!u || typeof b.password !== 'string' || !checkPassword(b.password, u.password_hash)) {
    return c.json({ error: 'Invalid email or password.' }, 401)
  }
  run('DELETE FROM sessions WHERE expires_at < ?', Date.now())
  startSession(c, u.id)
  return c.json(toProfile(get(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, u.id)))
})

api.post('/auth/logout', (c) => {
  const sid = getCookie(c, 'sid')
  if (sid) run('DELETE FROM sessions WHERE token = ?', sid)
  deleteCookie(c, 'sid', { path: '/' })
  return c.json({ ok: true })
})

// ── Compte ──────────────────────────────────────────────────────────────

api.patch('/me', requireUser, async (c) => {
  const b = await c.req.json()
  const displayName = str(b.display_name, 50)
  if (!displayName) return bad(c, 'Display name is required.', 'displayName')
  const pilots = Array.isArray(b.top_pilots) ? b.top_pilots.filter((id) => typeof id === 'string').slice(0, 3) : []
  const known = pilots.filter((id) => get('SELECT 1 FROM drivers WHERE id = ?', id))
  run('UPDATE users SET display_name = ?, bio = ?, favorite_team = ? , top_pilots = ? WHERE id = ?',
    displayName, str(b.bio, 500) || null, str(b.favorite_team, 50) || null,
    known.length ? JSON.stringify(known) : null, c.get('user').id)
  return c.json(toProfile(get(`SELECT ${PROFILE_COLS} FROM users WHERE id = ?`, c.get('user').id)))
})

const AVATAR_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' }

api.post('/me/avatar', requireUser, async (c) => {
  const file = (await c.req.parseBody()).file
  const ext = AVATAR_TYPES[file?.type]
  if (!ext) return bad(c, 'Image must be PNG, JPEG, WebP or GIF.')
  if (file.size > 2 * 1024 * 1024) return bad(c, 'Image must be under 2 MB.')
  const id = c.get('user').id
  const dir = join(DATA_DIR, 'avatars')
  for (const f of readdirSync(dir)) if (f.startsWith(id + '.')) unlinkSync(join(dir, f))
  writeFileSync(join(dir, `${id}.${ext}`), Buffer.from(await file.arrayBuffer()))
  const url = `/avatars/${id}.${ext}?v=${Date.now()}`
  run('UPDATE users SET avatar_url = ? WHERE id = ?', url, id)
  return c.json({ avatar_url: url })
})

api.put('/me/password', requireUser, async (c) => {
  const { password } = await c.req.json()
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) return bad(c, 'Password must be at least 8 characters.')
  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(password), c.get('user').id)
  return c.json({ ok: true })
})

api.delete('/me', requireUser, (c) => {
  const id = c.get('user').id
  run('DELETE FROM users WHERE id = ?', id) // cascade : sessions, notes, critiques, likes, follows
  const dir = join(DATA_DIR, 'avatars')
  for (const f of readdirSync(dir)) if (f.startsWith(id + '.')) unlinkSync(join(dir, f))
  deleteCookie(c, 'sid', { path: '/' })
  return c.json({ ok: true })
})

// ── GPs ─────────────────────────────────────────────────────────────────

const RACE_COLS = 'r.id, r.season, r.round, r.name, r.slug, r.circuit, r.country, r.date, r.poster_url, r.race_type'

api.get('/home', (c) => c.json({
  latest: all(`SELECT ${RACE_COLS}, ROUND(AVG(rt.score), 1) AS avgRating, COUNT(rt.score) AS reviewCount
    FROM races r LEFT JOIN ratings rt ON rt.race_id = r.id WHERE ${PAST} GROUP BY r.id ORDER BY r.date DESC LIMIT 6`),
  next: get(`SELECT ${RACE_COLS} FROM races r WHERE date >= date('now') ORDER BY date LIMIT 1`) ?? null,
}))

api.get('/feed', requireUser, (c) => c.json(all(`
  SELECT rt.user_id || rt.race_id AS id, rt.created_at, rt.score AS rating,
         u.username, u.display_name AS displayName,
         r.name AS raceName, r.season AS raceSeason, r.slug AS raceSlug, r.poster_url AS posterUrl, r.country AS raceCountry
  FROM ratings rt
  JOIN follows f ON f.following_id = rt.user_id AND f.follower_id = ?
  JOIN users u ON u.id = rt.user_id
  JOIN races r ON r.id = rt.race_id
  ORDER BY rt.created_at DESC LIMIT 6`, c.get('user').id)))

api.get('/races', (c) => {
  const latestSeason = get(`SELECT MAX(season) AS s FROM races WHERE ${PAST}`).s
  const season = c.req.query('season') === undefined ? latestSeason : Number(c.req.query('season'))
  const races = all(`
    SELECT ${RACE_COLS}, ROUND(AVG(rt.score), 1) AS avgRating, COUNT(rt.score) AS reviewCount
    FROM races r LEFT JOIN ratings rt ON rt.race_id = r.id
    WHERE ${PAST} AND (? = 0 OR r.season = ?)
    GROUP BY r.id ORDER BY r.date DESC`, season, season)
  return c.json({ latestSeason, races })
})

api.get('/races/:season/:slug', (c) => {
  const me = c.get('user')
  const race = get('SELECT * FROM races WHERE season = ? AND slug = ?', Number(c.req.param('season')), c.req.param('slug'))
  if (!race) return c.json({ race: null })
  if (race.date >= new Date().toISOString().slice(0, 10)) return c.json({ race, isFuture: true })

  const raceDrivers = all(`
    SELECT rd.position, rd.grid_position, rd.status, rd.driver_id,
           json_object('id', d.id, 'given_name', d.given_name, 'family_name', d.family_name) AS drivers
    FROM race_drivers rd JOIN drivers d ON d.id = rd.driver_id WHERE rd.race_id = ?`, race.id)
    .map((rd) => ({ ...rd, drivers: JSON.parse(rd.drivers) }))

  const reviews = all(`
    SELECT rv.id, rv.content, rv.spoiler, rv.created_at, rv.user_id,
           u.username, u.display_name AS displayName, rt.score AS rating,
           (SELECT COUNT(*) FROM likes l WHERE l.review_id = rv.id) AS likes
    FROM reviews rv JOIN users u ON u.id = rv.user_id
    LEFT JOIN ratings rt ON rt.user_id = rv.user_id AND rt.race_id = rv.race_id
    WHERE rv.race_id = ? ORDER BY rv.created_at DESC`, race.id)
    .map((r) => ({ ...r, spoiler: !!r.spoiler }))

  const myReview = me && get('SELECT id, content, spoiler FROM reviews WHERE user_id = ? AND race_id = ?', me.id, race.id)

  return c.json({
    race,
    isFuture: false,
    raceDrivers,
    reviews,
    avgRating: get('SELECT ROUND(AVG(score), 1) AS a FROM ratings WHERE race_id = ?', race.id).a,
    followingIds: me ? all('SELECT following_id FROM follows WHERE follower_id = ?', me.id).map((f) => f.following_id) : [],
    myRating: me ? get('SELECT score FROM ratings WHERE user_id = ? AND race_id = ?', me.id, race.id)?.score ?? null : null,
    myReview: myReview ? { ...myReview, spoiler: !!myReview.spoiler } : null,
    myLikes: me ? all('SELECT l.review_id FROM likes l JOIN reviews rv ON rv.id = l.review_id WHERE l.user_id = ? AND rv.race_id = ?', me.id, race.id).map((l) => l.review_id) : [],
  })
})

const pastRace = (id) => get(`SELECT id FROM races WHERE id = ? AND ${PAST}`, id)
const raceAvg = (id) => get('SELECT ROUND(AVG(score), 1) AS a FROM ratings WHERE race_id = ?', id).a

api.put('/races/:id/rating', requireUser, async (c) => {
  const { score } = await c.req.json()
  if (!pastRace(c.req.param('id'))) return c.json({ error: 'Race not found.' }, 404)
  if (typeof score !== 'number' || score < 0.5 || score > 5 || score * 2 !== Math.round(score * 2)) return bad(c, 'Invalid score.')
  run(`INSERT INTO ratings (user_id, race_id, score) VALUES (?, ?, ?)
       ON CONFLICT (user_id, race_id) DO UPDATE SET score = excluded.score`, c.get('user').id, c.req.param('id'), score)
  return c.json({ avgRating: raceAvg(c.req.param('id')) })
})

api.delete('/races/:id/rating', requireUser, (c) => {
  run('DELETE FROM ratings WHERE user_id = ? AND race_id = ?', c.get('user').id, c.req.param('id'))
  return c.json({ avgRating: raceAvg(c.req.param('id')) })
})

api.put('/races/:id/review', requireUser, async (c) => {
  const b = await c.req.json()
  const content = str(b.content, 5000)
  if (!content) return bad(c, 'Review cannot be empty.')
  if (!pastRace(c.req.param('id'))) return c.json({ error: 'Race not found.' }, 404)
  const me = c.get('user').id
  run(`INSERT INTO reviews (id, user_id, race_id, content, spoiler) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, race_id) DO UPDATE SET content = excluded.content, spoiler = excluded.spoiler`,
  randomUUID(), me, c.req.param('id'), content, b.spoiler ? 1 : 0)
  const review = get('SELECT id, content, spoiler, created_at FROM reviews WHERE user_id = ? AND race_id = ?', me, c.req.param('id'))
  return c.json({ ...review, spoiler: !!review.spoiler })
})

api.delete('/races/:id/review', requireUser, (c) => {
  run('DELETE FROM reviews WHERE user_id = ? AND race_id = ?', c.get('user').id, c.req.param('id'))
  return c.json({ ok: true })
})

api.post('/reviews/:id/like', requireUser, (c) => {
  const review = get('SELECT user_id FROM reviews WHERE id = ?', c.req.param('id'))
  if (!review) return c.json({ error: 'Review not found.' }, 404)
  if (review.user_id === c.get('user').id) return bad(c, 'You cannot like your own review.')
  run('INSERT OR IGNORE INTO likes VALUES (?, ?)', c.get('user').id, c.req.param('id'))
  return c.json({ ok: true })
})

api.delete('/reviews/:id/like', requireUser, (c) => {
  run('DELETE FROM likes WHERE user_id = ? AND review_id = ?', c.get('user').id, c.req.param('id'))
  return c.json({ ok: true })
})

api.get('/reviews/:season/:slug/:username', (c) => {
  const race = get('SELECT * FROM races WHERE season = ? AND slug = ?', Number(c.req.param('season')), c.req.param('slug'))
  const reviewer = get('SELECT id, username, display_name, avatar_url FROM users WHERE username = ?', c.req.param('username'))
  const review = race && reviewer && get('SELECT id, content, spoiler, created_at FROM reviews WHERE user_id = ? AND race_id = ?', reviewer.id, race.id)
  if (!review) return c.json({ race: race ?? null, review: null })
  return c.json({
    race,
    reviewer,
    review: { ...review, spoiler: !!review.spoiler },
    rating: get('SELECT score FROM ratings WHERE user_id = ? AND race_id = ?', reviewer.id, race.id)?.score ?? null,
    likers: all('SELECT u.id, u.username, u.display_name, u.avatar_url FROM likes l JOIN users u ON u.id = l.user_id WHERE l.review_id = ?', review.id),
  })
})

// ── Saisons ─────────────────────────────────────────────────────────────

api.get('/seasons', (c) => c.json(all(`
  SELECT r.season AS year, COUNT(DISTINCT r.id) AS raceCount,
         ROUND(AVG(rt.score), 1) AS avgRating, COUNT(rt.score) AS ratingCount
  FROM races r LEFT JOIN ratings rt ON rt.race_id = r.id
  WHERE r.race_type = 'race' AND ${PAST}
  GROUP BY r.season ORDER BY r.season DESC`)))

api.get('/seasons/:year', (c) => {
  const races = all(`
    SELECT r.id, r.name, r.slug, r.country, r.date, r.race_type,
           ROUND(AVG(rt.score), 1) AS avg, COUNT(rt.score) AS ratingCount
    FROM races r LEFT JOIN ratings rt ON rt.race_id = r.id
    WHERE r.season = ? AND r.race_type = 'race' AND ${PAST}
    GROUP BY r.id ORDER BY r.date`, Number(c.req.param('year')))
  const totals = get(`
    SELECT ROUND(AVG(rt.score), 1) AS avgRating, COUNT(*) AS totalRatings
    FROM ratings rt JOIN races r ON r.id = rt.race_id
    WHERE r.season = ? AND r.race_type = 'race' AND ${PAST}`, Number(c.req.param('year')))
  return c.json({
    seasonStats: { raceCount: races.length, ...totals },
    topRatedRaces: races.filter((r) => r.avg != null).sort((a, b) => b.avg - a.avg).slice(0, 5),
  })
})

// ── Pilotes ─────────────────────────────────────────────────────────────

api.get('/drivers', (c) => {
  const latestSeason = get('SELECT MAX(season) AS s FROM races').s
  return c.json({
    latestSeason,
    drivers: all('SELECT id, given_name, family_name, nationality, photo_url, number FROM drivers'),
    currentIds: all('SELECT DISTINCT rd.driver_id FROM race_drivers rd JOIN races r ON r.id = rd.race_id WHERE r.season = ?', latestSeason).map((r) => r.driver_id),
    winsMap: Object.fromEntries(all(`
      SELECT rd.driver_id, COUNT(*) AS wins FROM race_drivers rd JOIN races r ON r.id = rd.race_id
      WHERE rd.position = 1 AND r.race_type = 'race' GROUP BY rd.driver_id`).map((w) => [w.driver_id, w.wins])),
  })
})

api.get('/drivers/:id', (c) => {
  const pilote = get('SELECT * FROM drivers WHERE id = ?', c.req.param('id'))
  if (!pilote) return c.json({ pilote: null })
  const entries = all(`
    SELECT rd.race_id, rd.position, rd.grid_position, rd.status,
           json_object('id', r.id, 'season', r.season, 'name', r.name, 'slug', r.slug, 'date', r.date, 'race_type', r.race_type) AS races,
           r.race_type, r.date < date('now') AS past
    FROM race_drivers rd JOIN races r ON r.id = rd.race_id
    WHERE rd.driver_id = ? ORDER BY r.date DESC`, pilote.id)
  const racesOnly = entries.filter((e) => e.race_type === 'race')
  return c.json({
    pilote,
    stats: {
      wins: racesOnly.filter((e) => e.position === 1).length,
      podiums: racesOnly.filter((e) => e.position != null && e.position <= 3).length,
      courses: racesOnly.length,
    },
    derniersGPs: entries.filter((e) => e.past).slice(0, 10)
      .map(({ race_id, position, grid_position, status, races }) => ({ race_id, position, grid_position, status, races: JSON.parse(races) })),
  })
})

// ── Utilisateurs ────────────────────────────────────────────────────────

api.get('/users', (c) => {
  const q = str(c.req.query('q'), 50).toLowerCase().replace(/[%_\\]/g, '\\$&')
  if (!q) return c.json([])
  return c.json(all(`SELECT username, display_name, avatar_url, bio FROM users
    WHERE username LIKE ? ESCAPE '\\' OR display_name LIKE ? ESCAPE '\\' LIMIT 20`, `%${q}%`, `%${q}%`))
})

const RATING_STEPS = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5]

api.get('/users/:username', (c) => {
  const me = c.get('user')
  const profil = toProfile(get(`SELECT ${PROFILE_COLS} FROM users WHERE username = ?`, c.req.param('username')))
  if (!profil) return c.json({ profil: null })

  const scores = all('SELECT rt.score, r.season FROM ratings rt JOIN races r ON r.id = rt.race_id WHERE rt.user_id = ?', profil.id)
  const distribution = RATING_STEPS.map((value) => ({ value, count: scores.filter((s) => s.score === value).length }))

  const reviews = all(`
    SELECT rv.id, rv.content, rv.spoiler, rv.created_at,
           r.name AS raceName, r.season AS raceSeason, r.slug AS raceSlug, rt.score AS rating,
           (SELECT COUNT(*) FROM likes l WHERE l.review_id = rv.id) AS likeCount
    FROM reviews rv JOIN races r ON r.id = rv.race_id
    LEFT JOIN ratings rt ON rt.user_id = rv.user_id AND rt.race_id = rv.race_id
    WHERE rv.user_id = ? ORDER BY rv.created_at DESC`, profil.id)
    .map((r) => ({ ...r, spoiler: !!r.spoiler }))

  const drivers = profil.top_pilots?.length
    ? all(`SELECT id, given_name, family_name FROM drivers WHERE id IN (${profil.top_pilots.map(() => '?').join(',')})`, ...profil.top_pilots)
    : []

  return c.json({
    profil,
    stats: {
      notes: scores.length,
      currentSeason: scores.filter((s) => s.season === new Date().getFullYear()).length,
      critiques: reviews.length,
      abonnes: get('SELECT COUNT(*) AS n FROM follows WHERE following_id = ?', profil.id).n,
      abonnements: get('SELECT COUNT(*) AS n FROM follows WHERE follower_id = ?', profil.id).n,
    },
    ratingStats: scores.length ? {
      avg: (scores.reduce((a, s) => a + s.score, 0) / scores.length).toFixed(1),
      total: scores.length,
      distribution,
      maxCount: Math.max(...distribution.map((d) => d.count), 1),
    } : null,
    reviews,
    topPilotes: profil.top_pilots?.map((id) => drivers.find((d) => d.id === id)).filter(Boolean) ?? [],
    isFollowing: !!(me && get('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?', me.id, profil.id)),
  })
})

const followTarget = (c) => get('SELECT id FROM users WHERE username = ?', c.req.param('username'))

api.post('/users/:username/follow', requireUser, (c) => {
  const target = followTarget(c)
  if (!target) return c.json({ error: 'User not found.' }, 404)
  if (target.id === c.get('user').id) return bad(c, 'You cannot follow yourself.')
  run('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)', c.get('user').id, target.id)
  return c.json({ ok: true })
})

api.delete('/users/:username/follow', requireUser, (c) => {
  const target = followTarget(c)
  if (target) run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', c.get('user').id, target.id)
  return c.json({ ok: true })
})

// ── Proxy Jolpica avec cache ────────────────────────────────────────────
// Le premier visiteur paie la latence de Jolpica, les suivants sont servis depuis la mémoire.
// ponytail: cache mémoire non borné, vidé au redémarrage ; suffisant pour ~30 saisons de classements.

const f1Cache = new Map()
const CURRENT_SEASON = String(new Date().getFullYear())

api.get('/f1/*', async (c) => {
  const path = c.req.path.slice('/api/f1/'.length)
  if (!/^[\w/.]+$/.test(path)) return c.json({ error: 'Bad path.' }, 400)
  const url = `https://api.jolpi.ca/ergast/f1/${path}${new URL(c.req.url).search}`
  const hit = f1Cache.get(url)
  if (hit && hit.expires > Date.now()) return c.json(hit.data)

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) return c.json({ error: `Jolpica ${res.status}` }, 502)
  const data = await res.json()
  const ttl = path.startsWith(CURRENT_SEASON) ? 3600e3 : 30 * 864e5 // saison en cours : 1h, passées : 30j
  f1Cache.set(url, { data, expires: Date.now() + ttl })
  return c.json(data)
})

api.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Server error.' }, 500)
})

// ── App ─────────────────────────────────────────────────────────────────

app.route('/api', api)
app.use('/avatars/*', serveStatic({ root: DATA_DIR }))
app.use('/assets/*', serveStatic({ root: 'dist', onFound: (_, c) => c.header('Cache-Control', 'public, max-age=31536000, immutable') }))
app.use('*', serveStatic({ root: 'dist' }))
app.get('*', serveStatic({ path: 'dist/index.html' })) // fallback SPA

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: app.fetch, port }, () => console.log(`Pitstoppd sur http://localhost:${port}`))

