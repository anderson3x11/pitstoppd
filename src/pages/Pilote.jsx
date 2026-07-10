import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getWDC } from '../lib/driverWDC'
import { TODAY } from '../lib/constants'
import { getPageCache, setPageCache } from '../lib/pageCache'

export default function Pilote() {
  const { id } = useParams()
  const { loading: authLoading } = useAuth()
  const [pilote, setPilote] = useState(null)
  const [stats, setStats] = useState({ wins: 0, podiums: 0, courses: 0 })
  const [derniersGPs, setDerniersGPs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const cached = getPageCache(`pilote:${id}`)
    if (cached) {
      setPilote(cached.pilote)
      setStats(cached.stats)
      setDerniersGPs(cached.derniersGPs)
      setLoading(false)
    } else {
      setLoading(true)
    }

    async function load() {
      // Parallel: driver info + race entries + races metadata
      const [
        { data: driverData },
        { data: rdData },
        { data: racesData },
      ] = await Promise.all([
        supabase.from('drivers').select('*').eq('id', id).single(),
        supabase.from('race_drivers').select('race_id, position, grid_position, status').eq('driver_id', id),
        supabase.from('races').select('id, season, name, slug, date, race_type'),
      ])

      if (!driverData) {
        setLoading(false)
        return
      }
      setPilote(driverData)

      // Join client-side (avoids cross-table join on large table)
      const raceLookup = {}
      for (const r of racesData ?? []) raceLookup[r.id] = r

      const entries = (rdData ?? [])
        .map((rd) => ({ ...rd, races: raceLookup[rd.race_id] }))
        .filter((rd) => rd.races?.date)
        .sort((a, b) => new Date(b.races.date) - new Date(a.races.date))

      const racesOnly = entries.filter((rd) => rd.races.race_type === 'race')

      const newStats = {
        wins: racesOnly.filter((rd) => rd.position === 1).length,
        podiums: racesOnly.filter((rd) => rd.position != null && rd.position <= 3).length,
        courses: racesOnly.length,
      }
      const recent = entries.filter((rd) => rd.races.date < TODAY).slice(0, 10)

      setStats(newStats)
      setDerniersGPs(recent)
      setPageCache(`pilote:${id}`, { pilote: driverData, stats: newStats, derniersGPs: recent })
      setLoading(false)
    }

    load()
  }, [id, authLoading])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Loading…</p>
      </div>
    )
  }

  if (!pilote) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted text-sm">Driver not found.</p>
      </div>
    )
  }

  const age = pilote.date_of_birth
    ? Math.floor((new Date() - new Date(pilote.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const initiales = [pilote.given_name, pilote.family_name]
    .filter(Boolean)
    .map((n) => n[0])
    .join('')

  const wdc = getWDC(pilote.id)

  const statsList = [
    { label: 'Wins', value: stats.wins },
    { label: 'Podiums', value: stats.podiums },
    { label: 'Races', value: stats.courses },
    ...(wdc > 0 ? [{ label: 'WDC', value: wdc, highlight: true }] : []),
  ]

  return (
    <div>

      {/* ── Hero header ── */}
      <section className="relative border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-br from-card-hover via-card to-page" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 60%, rgba(232, 0, 45, 0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-page via-transparent to-transparent" />

        {pilote.number != null && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="mx-auto max-w-4xl px-4 h-full flex items-center justify-center">
              <span className="text-[18rem] text-white/[0.04] blur-sm leading-none italic" style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 900 }}>
                {pilote.number}
              </span>
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-4xl px-4 py-16 flex items-end gap-8">
          {/* Photo */}
          <div className="hidden sm:block w-48 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl aspect-[2/3] bg-card-hover">
            {getDriverPhoto(pilote) ? (
              <img
                src={getDriverPhoto(pilote)}
                alt={`${pilote.given_name} ${pilote.family_name}`}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card p-3">
                {pilote.number != null && (
                  <span className="text-3xl font-black text-subtle leading-none">{pilote.number}</span>
                )}
                <span className="text-lg font-bold text-subtle">{initiales}</span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 space-y-3 min-w-0 pb-1">
            <div className="flex items-center gap-2 text-sm text-subtle">
              <Link to="/pilotes" className="hover:text-white transition-colors cursor-pointer">Drivers</Link>
            </div>
            <h1 className="text-5xl font-black text-white leading-tight">
              {pilote.given_name} {pilote.family_name}
            </h1>
            <p className="text-base text-muted">
              {[pilote.nationality, age != null ? `${age} years old` : null].filter(Boolean).join(' · ')}
            </p>
            {pilote.bio && (
              <p className="text-base text-muted leading-relaxed max-w-lg pt-1">{pilote.bio}</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">

        {/* ── Stats ── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-5">
            Statistics <span className="text-subtle font-normal text-sm">(2000–present)</span>
          </h2>
          <div className={`grid gap-3 ${statsList.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {statsList.map((stat) => (
              <div key={stat.label} className={`rounded-lg border px-3 py-5 text-center ${stat.highlight ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-line bg-card'}`}>
                <p className={`text-4xl font-black ${stat.highlight ? 'text-yellow-400' : 'text-white'}`}>{stat.value}</p>
                <p className="text-xs text-subtle mt-1 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent races ── */}
        <section>
          <h2 className="text-lg font-bold text-white mb-5">Recent Races</h2>
          {derniersGPs.length > 0 ? (
            <div className="space-y-2">
              {derniersGPs.map((rd) => {
                const race = rd.races
                return (
                  <Link
                    key={race.id}
                    to={`/gps/${race.season}/${race.slug}`}
                    className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 hover:border-subtle hover:bg-card-hover transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium text-white">{race.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-subtle">{race.season}</span>
                      {rd.position != null ? (
                        <span className={`text-sm font-bold ${rd.position === 1 ? 'text-f1-red' : 'text-muted'}`}>
                          P{rd.position}
                        </span>
                      ) : (
                        <span className="text-xs text-subtle">{rd.status ?? 'DNF'}</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-subtle">No races available.</p>
          )}
        </section>

      </div>
    </div>
  )
}
