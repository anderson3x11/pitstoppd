import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getDriverPhoto } from '../lib/driverPhotos'

function PiloteCard({ pilote, wins, isChampion }) {
  const initiales = [pilote.given_name, pilote.family_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')

  return (
    <Link to={`/pilotes/${pilote.id}`} className="group block">
      <div className={`rounded-lg overflow-hidden bg-card border transition-colors duration-150 ${isChampion ? 'border-2 border-yellow-500/70 hover:border-yellow-400 ring-2 ring-yellow-500/20' : 'border-line hover:border-subtle'}`}>

        {/* Visuel */}
        <div className="aspect-[2/3] bg-card-hover relative overflow-hidden">
          {getDriverPhoto(pilote) ? (
            <img
              src={getDriverPhoto(pilote)}
              alt={`${pilote.given_name} ${pilote.family_name}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card p-3">
              {pilote.number != null && (
                <span className="text-3xl font-black text-subtle leading-none">
                  {pilote.number}
                </span>
              )}
              <span className="text-lg font-bold text-subtle">{initiales}</span>
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="p-2.5 space-y-0.5">
          <p className="text-xs font-semibold text-white leading-snug line-clamp-2">
            {pilote.given_name} {pilote.family_name}
          </p>
          <p className="text-[11px] text-subtle">{pilote.nationality}</p>
          <p className="text-[11px] text-muted">
            {wins} win{wins !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function Pilotes() {
  const [drivers, setDrivers] = useState([])
  const [currentIds, setCurrentIds] = useState(new Set())
  const [latestSeason, setLatestSeason] = useState(null)
  const [winsMap, setWinsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      // 1. Fetch races metadata (small table, no join needed)
      const { data: racesData } = await supabase
        .from('races')
        .select('id, season, race_type')

      const latestSeason = racesData?.length
        ? Math.max(...racesData.map((r) => r.season))
        : new Date().getFullYear()
      setLatestSeason(latestSeason)

      // Build lookups from races
      const raceIsRace = new Set()
      const seasonRaceIds = []
      for (const r of racesData ?? []) {
        if (r.race_type === 'race') raceIsRace.add(r.id)
        if (r.season === latestSeason) seasonRaceIds.push(r.id)
      }

      // 2. Parallel: drivers + current season entries + all P1 (no cross-table joins)
      const [
        { data: driversData },
        { data: currentData },
        { data: winsData },
      ] = await Promise.all([
        supabase
          .from('drivers')
          .select('id, given_name, family_name, nationality, photo_url, number'),

        supabase
          .from('race_drivers')
          .select('driver_id')
          .in('race_id', seasonRaceIds),

        supabase
          .from('race_drivers')
          .select('driver_id, race_id')
          .eq('position', 1),
      ])

      const ids = new Set(currentData?.map((r) => r.driver_id) ?? [])
      setCurrentIds(ids)

      // Count wins for races only (filter sprints client-side)
      const wins = {}
      for (const row of winsData ?? []) {
        if (raceIsRace.has(row.race_id)) {
          wins[row.driver_id] = (wins[row.driver_id] ?? 0) + 1
        }
      }
      setWinsMap(wins)

      setDrivers(driversData ?? [])
      setLoading(false)
    }

    load()
  }, [])

  const query = search.toLowerCase().trim()

  const filtered = useMemo(
    () =>
      drivers.filter((d) => {
        if (!query) return true
        const full = `${d.given_name} ${d.family_name}`.toLowerCase()
        return full.includes(query) || d.nationality?.toLowerCase().includes(query)
      }),
    [drivers, query],
  )

  const current = useMemo(
    () =>
      filtered
        .filter((d) => currentIds.has(d.id))
        .sort((a, b) => (a.number ?? 999) - (b.number ?? 999)),
    [filtered, currentIds],
  )

  const retired = useMemo(
    () =>
      filtered
        .filter((d) => !currentIds.has(d.id))
        .sort((a, b) => (winsMap[b.id] ?? 0) - (winsMap[a.id] ?? 0)),
    [filtered, winsMap, currentIds],
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* Header + search */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white">Drivers</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? 'Loading…' : `${drivers.length} drivers · 2000–${latestSeason} seasons`}
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for a driver…"
          className="w-full sm:w-64 rounded bg-card border border-line px-3 py-2 text-sm text-white placeholder:text-subtle focus:outline-none focus:border-subtle"
        />
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="space-y-10">

          {/* Current Grid */}
          {current.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                {latestSeason} Grid
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {current.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} isChampion={p.number === 1} />
                ))}
              </div>
            </section>
          )}

          {/* Former drivers */}
          {retired.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                Former Drivers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {retired.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <p className="text-center py-20 text-muted text-sm">
              No driver found for "{search}".
            </p>
          )}

        </div>
      )}
    </div>
  )
}
