import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getDriverPhoto } from '../lib/driverPhotos'

const TODAY = new Date().toISOString().split('T')[0]

export default function Pilote() {
  const { id } = useParams()
  const [pilote, setPilote] = useState(null)
  const [stats, setStats] = useState({ wins: 0, podiums: 0, courses: 0 })
  const [derniersGPs, setDerniersGPs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    async function load() {
      // Fetch driver
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single()

      if (!driverData) {
        setLoading(false)
        return
      }
      setPilote(driverData)

      // Fetch all race participations with race info
      const { data: rdData } = await supabase
        .from('race_drivers')
        .select('position, grid_position, status, races(id, season, name, slug, date)')
        .eq('driver_id', id)

      const sorted = (rdData ?? [])
        .filter((rd) => rd.races?.date)
        .sort((a, b) => new Date(b.races.date) - new Date(a.races.date))

      setStats({
        wins: sorted.filter((rd) => rd.position === 1).length,
        podiums: sorted.filter((rd) => rd.position != null && rd.position <= 3).length,
        courses: sorted.length,
      })

      setDerniersGPs(sorted.filter((rd) => rd.races.date < TODAY).slice(0, 10))
      setLoading(false)
    }

    load()
  }, [id])

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* ── Driver header ── */}
      <div className="flex gap-6 mb-10">
        {/* Photo */}
        <div className="hidden sm:flex w-32 h-40 shrink-0 rounded-lg border border-line bg-card-hover items-center justify-center overflow-hidden">
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
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted mb-1">
            <Link to="/pilotes" className="hover:text-white transition-colors">Drivers</Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white">{pilote.given_name} {pilote.family_name}</h1>
            {pilote.number != null && (
              <span className="text-2xl font-black text-f1-red">#{pilote.number}</span>
            )}
          </div>
          <p className="text-sm text-muted">
            {[pilote.nationality, age != null ? `${age} years old` : null].filter(Boolean).join(' · ')}
          </p>
          {pilote.bio && (
            <p className="text-sm text-muted leading-relaxed max-w-lg">{pilote.bio}</p>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <section className="mb-10">
        <h2 className="text-base font-bold text-white mb-4">
          Statistics <span className="text-subtle font-normal text-xs">(2020–present)</span>
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Wins', value: stats.wins },
            { label: 'Podiums', value: stats.podiums },
            { label: 'Races', value: stats.courses },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-line bg-card px-3 py-3 text-center">
              <p className="text-xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-subtle mt-0.5 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent races ── */}
      <section>
        <h2 className="text-base font-bold text-white mb-4">Recent Races</h2>
        {derniersGPs.length > 0 ? (
          <div className="space-y-2">
            {derniersGPs.map((rd) => {
              const race = rd.races
              return (
                <Link
                  key={race.id}
                  to={`/gps/${race.season}/${race.slug}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3 hover:border-subtle hover:bg-card-hover transition-colors"
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
  )
}
