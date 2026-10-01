import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/PageState'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getTeamColor } from '../lib/teamColors'
import { getDriverStandings } from '../lib/f1api'
import { getPageCache, setPageCache } from '../lib/pageCache'

function PiloteCard({ pilote, wins, team }) {
  const initiales = [pilote.given_name, pilote.family_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')

  const teamColor = team ? getTeamColor(team) : null
  const photo = getDriverPhoto(pilote)

  return (
    <Link to={`/pilotes/${pilote.id}`} className="group block">
      <div className="rounded-lg overflow-hidden bg-card border border-line group-hover:border-line-strong transition-colors duration-150">

        {/* Photo */}
        <div className="aspect-[3/4] bg-card-hover relative overflow-hidden">
          {photo ? (
            <img
              src={photo}
              alt={`${pilote.given_name} ${pilote.family_name}`}
              loading="lazy"
              className="h-full w-full object-cover object-top transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card p-3">
              {pilote.number != null && (
                <span className="font-display text-5xl font-bold text-line-strong leading-none">{pilote.number}</span>
              )}
              <span className="font-display text-2xl font-bold text-subtle">{initiales}</span>
            </div>
          )}

          {/* Team color strip at bottom */}
          {teamColor && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: teamColor.hex }}
            />
          )}
        </div>

        {/* Infos */}
        <div className="px-3 py-2.5 space-y-0.5">
          <p className="text-sm text-white leading-snug truncate group-hover:text-f1-red transition-colors">
            <span className="text-muted">{pilote.given_name}</span> <span className="font-semibold">{pilote.family_name}</span>
          </p>
          <p className="text-xs text-subtle truncate">{pilote.nationality}</p>
          {team ? (
            <p
              className="text-xs font-medium truncate"
              style={{ color: teamColor?.hex ?? '#a3a3a3' }}
            >
              {team}
            </p>
          ) : (
            <p className="text-xs text-muted">{wins > 0 ? `${wins} ${wins === 1 ? 'win' : 'wins'}` : 'No wins'}</p>
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

    const cached = getPageCache('pilotes')
    if (cached) {
      setDrivers(cached.drivers)
      setCurrentIds(cached.currentIds)
      setLatestSeason(cached.latestSeason)
      setWinsMap(cached.winsMap)
      setTeamMap(cached.teamMap)
      setLoading(false)
    }

    async function load() {
      const { latestSeason: latest, drivers: driversData, currentIds, winsMap: wins } = await api('/drivers')
      setLatestSeason(latest)
      const ids = new Set(currentIds)
      setCurrentIds(ids)
      setWinsMap(wins)

      const standings = await getDriverStandings(latest).catch(() => null)
      const teams = {}
      for (const s of standings?.DriverStandings ?? []) {
        const team = s.Constructors?.[0]?.name
        if (team) teams[s.Driver.driverId] = team
      }
      setTeamMap(teams)

      setDrivers(driversData ?? [])
      setPageCache('pilotes', {
        drivers: driversData ?? [],
        currentIds: ids,
        latestSeason: latest,
        winsMap: wins,
        teamMap: teams,
      })
      setLoading(false)
    }

    load().catch(() => setLoading(false))
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
    <div className="mx-auto max-w-6xl px-4 py-10">

      {/* Header + search */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h1 className="page-title">Drivers</h1>
          <p className="text-muted mt-2">
            {loading ? ' ' : `${drivers.length} drivers who raced between 2000 and ${latestSeason}`}
          </p>
        </div>
        <label className="relative w-full sm:w-72">
          <span className="sr-only">Search drivers</span>
          <Icon name="search" className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or nationality…"
            className="field pl-9"
          />
        </label>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }, (_, i) => <Skeleton key={i} className="aspect-[3/4.6] rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-12">

          {current.length > 0 && (
            <section>
              <h2 className="section-title border-b border-line pb-3 mb-4">{latestSeason} grid</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {current.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} team={teamMap[p.id] ?? null} />
                ))}
              </div>
            </section>
          )}

          {retired.length > 0 && (
            <section>
              <h2 className="section-title border-b border-line pb-3 mb-4">Former drivers <span className="font-sans text-base font-normal normal-case tracking-normal text-subtle">by wins</span></h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {retired.map((p) => (
                  <PiloteCard key={p.id} pilote={p} wins={winsMap[p.id] ?? 0} team={null} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <EmptyState title={`No driver matches “${search}”`}>Try a last name, like Hamilton, or a nationality, like Finnish.</EmptyState>
          )}

        </div>
      )}
    </div>
  )
}
