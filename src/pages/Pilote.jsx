import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageSkeleton, EmptyState } from '../components/PageState'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getWDC } from '../lib/driverWDC'
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
      const { pilote: driverData, stats: newStats, derniersGPs: recent } = await api(`/drivers/${id}`)
      if (!driverData) {
        setLoading(false)
        return
      }
      setPilote(driverData)
      setStats(newStats)
      setDerniersGPs(recent)
      setPageCache(`pilote:${id}`, { pilote: driverData, stats: newStats, derniersGPs: recent })
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [id, authLoading])

  if (loading) return <PageSkeleton />

  if (!pilote) return <EmptyState page title="Driver not found" action="All drivers" to="/pilotes">No driver matches this address.</EmptyState>

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
      <section className="relative overflow-hidden border-b border-line bg-card/40">
        {pilote.number != null && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="mx-auto max-w-6xl px-4 h-full flex items-center justify-end">
              <span className="font-display font-bold text-[12rem] sm:text-[20rem] text-white/[0.04] leading-none">
                {pilote.number}
              </span>
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14 flex items-end gap-6 sm:gap-10">
          {/* Photo */}
          <div className="w-28 sm:w-48 shrink-0 rounded-md overflow-hidden ring-1 ring-inset ring-white/10 aspect-[2/3] bg-card-hover shadow-[0_24px_48px_-16px_rgba(0,0,0,0.9)]">
            {getDriverPhoto(pilote) ? (
              <img
                src={getDriverPhoto(pilote)}
                alt={`${pilote.given_name} ${pilote.family_name}`}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card p-3">
                {pilote.number != null && (
                  <span className="font-display text-5xl font-bold text-line-strong leading-none">{pilote.number}</span>
                )}
                <span className="text-lg font-bold text-subtle">{initiales}</span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 space-y-3 min-w-0 pb-1">
            <nav aria-label="Breadcrumb" className="text-sm text-subtle">
              <Link to="/pilotes" className="hover:text-white transition-colors">Drivers</Link>
            </nav>
            <h1 className="font-display font-bold text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-white leading-[0.92] pr-3">
              {pilote.given_name} <span className="text-f1-red">{pilote.family_name}</span>
            </h1>
            <p className="text-base text-muted">
              {[pilote.nationality, age != null ? `${age} years old` : null].filter(Boolean).join(' · ')}
            </p>
            {pilote.bio && (
              <p className="text-base text-muted leading-relaxed max-w-[65ch] pt-1">{pilote.bio}</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-12">

        {/* ── Stats ── */}
        <section>
          <h2 className="section-title border-b border-line pb-3 mb-4">
            Career <span className="font-sans text-base font-normal normal-case tracking-normal text-subtle">since 2000</span>
          </h2>
          <dl className={`grid gap-3 grid-cols-2 ${statsList.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
            {statsList.map((stat) => (
              <div key={stat.label} className={`flex flex-col-reverse rounded-lg border px-4 py-4 ${stat.highlight ? 'border-star/40 bg-star/5' : 'border-line bg-card'}`}>
                <dt className="text-sm text-subtle">{stat.label === 'WDC' ? 'World titles' : stat.label}</dt>
                <dd className={`font-display text-4xl sm:text-5xl font-bold tabular-nums ${stat.highlight ? 'text-star' : 'text-white'}`}>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Recent races ── */}
        <section>
          <h2 className="section-title border-b border-line pb-3 mb-4">Recent races</h2>
          {derniersGPs.length > 0 ? (
            <ol className="rounded-lg border border-line bg-card/50">
              {derniersGPs.map((rd) => {
                const race = rd.races
                return (
                  <li key={race.id} className="border-b border-line last:border-0">
                    <Link
                      to={`/gps/${race.season}/${race.slug}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-card-hover transition-colors"
                    >
                      <span className={`w-10 text-sm font-semibold tabular-nums ${rd.position === 1 ? 'text-star' : rd.position != null ? 'text-white' : 'text-subtle'}`}>
                        {rd.position != null ? `P${rd.position}` : 'DNF'}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm text-white">{race.name}</span>
                      <span className="text-xs text-subtle shrink-0">{rd.position == null && rd.status ? `${rd.status} · ` : ''}{race.season}</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          ) : (
            <EmptyState title="No races on record">This driver has no results in the races Pitstoppd covers.</EmptyState>
          )}
        </section>

      </div>
    </div>
  )
}
