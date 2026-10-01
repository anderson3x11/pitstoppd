import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export const DATA_DIR = process.env.DATA_DIR ?? 'storage'
mkdirSync(join(DATA_DIR, 'avatars'), { recursive: true })

export const db = new DatabaseSync(join(DATA_DIR, 'pitstoppd.db'))

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS races (
    id         TEXT PRIMARY KEY,
    season     INTEGER NOT NULL,
    round      INTEGER NOT NULL,
    race_type  TEXT NOT NULL DEFAULT 'race' CHECK (race_type IN ('race', 'sprint')),
    name       TEXT NOT NULL,
    slug       TEXT NOT NULL,
    circuit    TEXT,
    country    TEXT,
    date       TEXT NOT NULL,
    poster_url TEXT,
    UNIQUE (season, round, race_type),
    UNIQUE (season, slug)
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id            TEXT PRIMARY KEY,
    given_name    TEXT,
    family_name   TEXT,
    nationality   TEXT,
    date_of_birth TEXT,
    photo_url     TEXT,
    bio           TEXT,
    number        INTEGER
  );

  CREATE TABLE IF NOT EXISTS race_drivers (
    race_id       TEXT NOT NULL REFERENCES races ON DELETE CASCADE,
    driver_id     TEXT NOT NULL REFERENCES drivers,
    position      INTEGER,
    grid_position INTEGER,
    status        TEXT,
    PRIMARY KEY (race_id, driver_id)
  );
  CREATE INDEX IF NOT EXISTS race_drivers_driver ON race_drivers (driver_id);

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    username      TEXT UNIQUE NOT NULL CHECK (username GLOB '[a-z0-9_-]*' AND length(username) BETWEEN 3 AND 20),
    display_name  TEXT NOT NULL,
    bio           TEXT,
    avatar_url    TEXT,
    favorite_team TEXT,
    top_pilots    TEXT,  -- JSON array de driver_id
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ratings (
    user_id    TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
    race_id    TEXT NOT NULL REFERENCES races ON DELETE CASCADE,
    score      REAL NOT NULL CHECK (score >= 0.5 AND score <= 5 AND score * 2 = CAST(score * 2 AS INTEGER)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, race_id)
  );
  CREATE INDEX IF NOT EXISTS ratings_race ON ratings (race_id);

  CREATE TABLE IF NOT EXISTS reviews (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
    race_id    TEXT NOT NULL REFERENCES races ON DELETE CASCADE,
    content    TEXT NOT NULL,
    spoiler    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, race_id)
  );
  CREATE INDEX IF NOT EXISTS reviews_race ON reviews (race_id);

  CREATE TABLE IF NOT EXISTS likes (
    user_id   TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
    review_id TEXT NOT NULL REFERENCES reviews ON DELETE CASCADE,
    PRIMARY KEY (user_id, review_id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id  TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users ON DELETE CASCADE,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
  );
`)

export const all = (sql, ...params) => db.prepare(sql).all(...params)
export const get = (sql, ...params) => db.prepare(sql).get(...params)
export const run = (sql, ...params) => db.prepare(sql).run(...params)

export function tx(fn) {
  db.exec('BEGIN')
  try { const r = fn(); db.exec('COMMIT'); return r }
  catch (e) { db.exec('ROLLBACK'); throw e }
}

// Données F1 de référence (GPs, posters, pilotes, résultats) : chargées depuis data/*.json si la base est vide
if (!get('SELECT 1 FROM races LIMIT 1')) {
  const load = (f) => JSON.parse(readFileSync(new URL(`../data/${f}.json`, import.meta.url)))
  tx(() => {
    const d = db.prepare('INSERT INTO drivers VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    for (const x of load('drivers')) d.run(x.id, x.given_name, x.family_name, x.nationality, x.date_of_birth, x.photo_url, x.bio, x.number)
    const r = db.prepare('INSERT INTO races VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    for (const x of load('races')) r.run(x.id, x.season, x.round, x.race_type, x.name, x.slug, x.circuit, x.country, x.date, x.poster_url)
    const rd = db.prepare('INSERT INTO race_drivers VALUES (?, ?, ?, ?, ?)')
    for (const x of load('race_drivers')) rd.run(x.race_id, x.driver_id, x.position, x.grid_position, x.status)
  })
  console.log('Seed F1 chargé depuis data/')
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

export function checkPassword(password, stored) {
  const [salt, hash] = stored.split(':')
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'))
}
