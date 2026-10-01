// Test de bout en bout de l'API sur une base jetable : npm run check
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const dir = mkdtempSync(join(tmpdir(), 'pitstoppd-'))
process.env.DATA_DIR = dir
process.env.PORT = '3999'
await import('./index.js')

const B = 'http://localhost:3999/api'
const jar = {}
async function call(who, method, path, body) {
  const res = await fetch(B + path, {
    method,
    headers: { 'content-type': 'application/json', cookie: jar[who] ?? '' },
    body: body && JSON.stringify(body),
  })
  const sid = res.headers.get('set-cookie')?.match(/sid=([^;]*)/)
  if (sid) jar[who] = `sid=${sid[1]}`
  return { status: res.status, body: await res.json() }
}

try {
  // Lecture publique
  const home = await call('anon', 'GET', '/home')
  assert.equal(home.body.latest.length, 6)
  const { body: { races, latestSeason } } = await call('anon', 'GET', '/races')
  assert.ok(races.length > 0 && races.every((r) => r.season === latestSeason))
  const race = races.at(-1)
  assert.equal((await call('anon', 'GET', '/me')).body, null)
  assert.equal((await call('anon', 'PUT', `/races/${race.id}/rating`, { score: 4 })).status, 401)

  // Inscription immédiate + validations
  const reg = (u, e) => call(u, 'POST', '/auth/register', { email: e, username: u, display_name: u.toUpperCase(), password: 'motdepasse' })
  assert.equal((await reg('alice', 'alice@test.dev')).body.username, 'alice')
  assert.equal((await reg('bob', 'bob@test.dev')).status, 200)
  assert.equal((await reg('alice', 'other@test.dev')).body.field, 'username')
  assert.equal((await reg('Bad Name', 'x@test.dev')).body.field, 'username')
  assert.equal((await call('alice', 'GET', '/me')).body.username, 'alice')

  // Note, critique, like, follow
  assert.equal((await call('alice', 'PUT', `/races/${race.id}/rating`, { score: 3.3 })).status, 400)
  assert.equal((await call('alice', 'PUT', `/races/${race.id}/rating`, { score: 4.5 })).body.avgRating, 4.5)
  assert.equal((await call('bob', 'PUT', `/races/${race.id}/rating`, { score: 3 })).body.avgRating, 3.8)
  const review = (await call('alice', 'PUT', `/races/${race.id}/review`, { content: 'Grosse course', spoiler: true })).body
  assert.equal((await call('alice', 'PUT', `/races/${race.id}/review`, { content: 'Edit', spoiler: false })).body.id, review.id)
  assert.equal((await call('alice', 'POST', `/reviews/${review.id}/like`)).status, 400)
  assert.equal((await call('bob', 'POST', `/reviews/${review.id}/like`)).status, 200)
  await call('bob', 'POST', '/users/alice/follow')

  const page = (await call('bob', 'GET', `/races/${race.season}/${race.slug}`)).body
  assert.deepEqual(page.reviews.map((r) => [r.username, r.rating, r.likes, r.content]), [['alice', 4.5, 1, 'Edit']])
  assert.deepEqual(page.myLikes, [review.id])
  assert.equal(page.myRating, 3)
  assert.equal((await call('bob', 'GET', '/feed')).body[0].username, 'alice')

  const profil = (await call('bob', 'GET', '/users/alice')).body
  assert.equal(profil.isFollowing, true)
  assert.equal(profil.stats.abonnes, 1)
  assert.equal(profil.reviews[0].likeCount, 1)
  assert.equal((await call('anon', 'GET', `/reviews/${race.season}/${race.slug}/alice`)).body.likers[0].username, 'bob')

  // Session : logout puis login
  await call('alice', 'POST', '/auth/logout')
  assert.equal((await call('alice', 'GET', '/me')).body, null)
  assert.equal((await call('alice', 'POST', '/auth/login', { email: 'alice@test.dev', password: 'mauvais' })).status, 401)
  assert.equal((await call('alice', 'POST', '/auth/login', { email: 'ALICE@test.dev', password: 'motdepasse' })).status, 200)

  // Avatar : type refusé, puis PNG servi par le serveur
  const upload = async (type) => {
    const body = new FormData()
    body.append('file', new Blob([new Uint8Array([137, 80, 78, 71])], { type }), 'a')
    const res = await fetch(B + '/me/avatar', { method: 'POST', headers: { cookie: jar.alice }, body })
    return { status: res.status, body: await res.json() }
  }
  assert.equal((await upload('text/html')).status, 400)
  const { avatar_url } = (await upload('image/png')).body
  assert.equal((await fetch('http://localhost:3999' + avatar_url)).status, 200)

  // Suppression de compte en cascade
  await call('alice', 'DELETE', '/me')
  assert.equal((await call('bob', 'GET', `/races/${race.season}/${race.slug}`)).body.reviews.length, 0)
  assert.equal((await call('bob', 'GET', '/users/alice')).body.profil, null)

  // Autres pages
  assert.ok((await call('anon', 'GET', '/seasons')).body.length >= 26)
  assert.ok((await call('anon', 'GET', '/seasons/2021')).body.seasonStats.raceCount > 20)
  assert.equal((await call('anon', 'GET', '/drivers/hamilton')).body.stats.wins > 100, true)
  assert.equal((await call('anon', 'GET', '/races/2020/styria')).body.race.name, 'Styrian Grand Prix')

  console.log('API OK')
} finally {
  ;(await import('./db.js')).db.close()
  rmSync(dir, { recursive: true, force: true })
  process.exit(process.exitCode ?? 0)
}
