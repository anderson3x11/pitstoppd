import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getTeamColor } from '../lib/teamColors'
import { getDriverStandings } from '../lib/f1api'

function PiloteCard({ pilote, wins, team }) {
  const initiales = [pilote.given_name, pilote.family_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')

  const teamColor = team ? getTeamColor(team) : null
  const photo = getDriverPhoto(pilote)

  return (
    <Link to={`/pilotes/${pilote.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-card border border-line hover:border-subtle transition-colors duration-150">

        {/* Photo */}
        <div className="aspect-[3/4] bg-card-hover relative overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={`${pilote.given_name} ${pilote.family_name}`}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card p-3">
              {pilote.number != null && (
                <span className="text-4xl font-black text-subtle leading-none">{pilote.number}</span>
              )}
              <span className="text-xl font-bold text-subtle">{initiales}</span>
            </div>
          )}

          {/* Team color strip at bottom */}
          {teamColor && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: teamColor.hex }}
            />
          )}
        </div>

        {/* Infos */}
        <div className="px-2.5 py-2 space-y-0.5">
          <p className="text-xs font-bold text-white leading-snug truncate">
            {pilote.given_name} {pilote.family_name}
          </p>
          <p className="text-[11px] text-subtle truncate">{pilote.nationality}</p>
          {team ? (
            <p
              className="text-[11px] font-medium truncate"
              style={{ color: teamColor?.hex ?? '#a3a3a3' }}
            >
              {team}
            </p>
          ) : (
            <p className="text-[11px] text-muted">{wins} win{wins !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Pilotes() {
  const { loading: authLoading } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [currentIds, setCurrentIds] = useState(new Set())
  const [latestSeason, setLatestSeason] = useState(null)
  const [winsMap, setWinsMap] = useState({})
  const [teamMap, setTeamMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (authLoading) return

    async function load() {
      const { data: racesData } = await supabase
        .from('races')
        .select('id, season, race_type')

      const latest = racesData?.length
        ? Math.max(...racesData.map((r) => r.season))
        : new Date().getFullYear()
      setLatestSeason(latest)

      const raceIsRace = new Set()
      const seasonRaceIds = []
      for (const r of racesData ?? []) {
        if (r.race_type === 'race') raceIsRace.add(r.id)
        if (r.season === latest) seasonRaceIds.push(r.id)
      }

      const [
        { data: driversData },
        { data: currentData },
        { data: winsData },
        standings,
      ] = await Promise.all([
        supabase.from('drivers').select('id, given_name, family_name, nationality, photo_url, number'),
        supabase.from('race_drivers').select('driver_id').in('race_id', seasonRaceIds),
        supabase.from('race_drivers').select('driver_id, race_id').eq('position', 1),
        getDriverStandings(latest).catch(() => null),
      ])

      const ids = new Set(currentData?.map((r) => r.driver_id) ?? [])
      setCurrentIds(ids)

      const wins = {}
      for (const row of winsData ?? []) {
        if (raceIsRace.has(row.race_id)) {
          wins[row.driver_id] = (wins[row.driver_id] ?? 0) + 1
        }
      }
      setWinsMap(wins)

      const teams = {}
      for (const s of standings?.DriverStandings ?? []) {
        const team = s.Constructors?.[0]?.name
        if (team) teams[s.Driver.driverId] = team
      }
      setTeamMap(teams)

      setDrivers(driversData ?? [])
      setLoading(false)
    }

    load()
  }, [authLoading])

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

          {current.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                {latestSeason} Grid
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {current.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} team={teamMap[p.id] ?? null} />
                ))}
              </div>
            </section>
          )}

          {retired.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-widest mb-4">
                Former Drivers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {retired.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} team={null} />
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
