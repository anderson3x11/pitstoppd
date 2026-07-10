import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getDriverStandings, getConstructorStandings } from '../lib/f1api'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'
import { TODAY } from '../lib/constants'
import { computeAvgRating, groupRatingsByRace } from '../lib/ratingUtils'
import { getPageCache, setPageCache } from '../lib/pageCache'

export default function Saison() {
  const { annee } = useParams()
  const season = parseInt(annee)
  const { loading: authLoading } = useAuth()

  const [driverStandings, setDriverStandings] = useState(null)
  const [constructorStandings, setConstructorStandings] = useState(null)
  const [seasonStats, setSeasonStats] = useState(null)
  const [topRatedRaces, setTopRatedRaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('drivers')

  useEffect(() => {
    if (authLoading) return

    const cached = getPageCache(`saison:${season}`)
    if (cached) {
      setDriverStandings(cached.driverStandings)
      setConstructorStandings(cached.constructorStandings)
      setSeasonStats(cached.seasonStats)
      setTopRatedRaces(cached.topRatedRaces)
      setLoading(false)
    } else {
      setLoading(true)
      setDriverStandings(null)
      setConstructorStandings(null)
      setSeasonStats(null)
      setTopRatedRaces([])
    }
    setTab('drivers')

    async function load() {
      // Fetch standings from Jolpica + race stats from Supabase in parallel
      const [driverRes, constructorRes, racesRes] = await Promise.all([
        getDriverStandings(season).catch(() => null),
        getConstructorStandings(season).catch(() => null),
        supabase
          .from('races')
          .select('id, name, slug, country, date, race_type')
          .eq('season', season)
          .eq('race_type', 'race')
          .lt('date', TODAY)
          .order('date', { ascending: true }),
      ])

      setDriverStandings(driverRes)
      setConstructorStandings(constructorRes)

      const races = racesRes.data ?? []
      let stats = { raceCount: 0, totalRatings: 0, avgRating: null }
      let topRated = []

      if (races.length > 0) {
        const raceIds = races.map((r) => r.id)
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('score, race_id')
          .in('race_id', raceIds)

        const scoresByRace = groupRatingsByRace(ratingsData)
        const allScores = (ratingsData ?? []).map((r) => r.score)

        stats = {
          raceCount: races.length,
          totalRatings: allScores.length,
          avgRating: computeAvgRating(allScores),
        }

        // Top rated races
        topRated = races.map((race) => {
          const scores = scoresByRace[race.id] ?? []
          return { ...race, avg: computeAvgRating(scores), ratingCount: scores.length }
        }).filter((r) => r.avg != null).sort((a, b) => b.avg - a.avg).slice(0, 5)
      }

      setSeasonStats(stats)
      setTopRatedRaces(topRated)
      setPageCache(`saison:${season}`, {
        driverStandings: driverRes,
        constructorStandings: constructorRes,
        seasonStats: stats,
        topRatedRaces: topRated,
      })
      setLoading(false)
    }

    load()
  }, [season, authLoading])

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10"><p className="text-muted text-sm">Loading…</p></div>

  const champion = driverStandings?.DriverStandings?.[0]
  const championTeam = champion?.Constructors?.[0]?.name
  const teamColor = getTeamColor(championTeam)
  const teamPhoto = getTeamPhoto(championTeam)

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative border-b border-line bg-[#101010]">
        {/* Bande plate couleur équipe championne */}
        <div className="h-1" style={{ background: teamColor?.hex ?? 'var(--color-f1-red)' }} />

        {teamPhoto && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="mx-auto max-w-6xl px-4 h-full flex items-center justify-end">
              <img src={teamPhoto} alt="" className="h-48 w-auto object-contain opacity-[0.06]" />
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-center gap-2 text-sm text-subtle mb-4">
            <Link to="/saisons" className="hover:text-white transition-colors">Seasons</Link>
            <span>/</span>
            <span>{annee}</span>
          </div>

          <h1 className="font-display font-black italic text-6xl md:text-7xl uppercase tracking-tight text-white leading-none mb-4 pr-3">Season {annee}</h1>

          {champion && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-f1-red">Champion</span>
              <span className="text-lg font-black text-white">
                {champion.Driver.givenName} {champion.Driver.familyName}
              </span>
              <span className="text-sm text-muted" style={{ color: teamColor?.hex }}>
                {championTeam}
              </span>
            </div>
          )}

          <div className="flex items-center gap-8">
            {seasonStats && (
              <>
                <div>
                  <p className="font-display text-3xl font-bold text-white tabular-nums">{seasonStats.raceCount}</p>
                  <p className="text-xs text-subtle uppercase tracking-wide">Races</p>
                </div>
                {seasonStats.avgRating != null && (
                  <div>
                    <p className="font-display text-3xl font-bold text-star tabular-nums">{seasonStats.avgRating}</p>
                    <p className="text-xs text-subtle uppercase tracking-wide">Avg rating</p>
                  </div>
                )}
                {seasonStats.totalRatings > 0 && (
                  <div>
                    <p className="font-display text-3xl font-bold text-white tabular-nums">{seasonStats.totalRatings}</p>
                    <p className="text-xs text-subtle uppercase tracking-wide">Total ratings</p>
                  </div>
                )}
                {driverStandings && (
                  <div>
                    <p className="font-display text-3xl font-bold text-white tabular-nums">{driverStandings.round}</p>
                    <p className="text-xs text-subtle uppercase tracking-wide">Rounds</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">

        {/* ── Standings tabs ── */}
        <section>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 w-fit mb-6">
            {[{ key: 'drivers', label: 'Drivers' }, { key: 'constructors', label: 'Constructors' }].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors cursor-pointer ${tab === t.key ? 'bg-card-hover text-white' : 'text-subtle hover:text-muted'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Driver standings */}
          {tab === 'drivers' && (
            driverStandings?.DriverStandings?.length > 0 ? (
              <div className="rounded-lg border border-line overflow-hidden">
                {driverStandings.DriverStandings.map((s, i) => {
                  const d = s.Driver
                  const team = s.Constructors?.[0]?.name
                  const tc = getTeamColor(team)
                  const photo = getDriverPhoto({ id: d.driverId, given_name: d.givenName, family_name: d.familyName })

                  return (
                    <div
                      key={d.driverId}
                      className={`flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-card-hover transition-colors ${i < 3 ? 'bg-card' : ''}`}
                    >
                      <span className={`w-6 text-sm font-black tabular-nums text-right shrink-0 ${i === 0 ? 'text-star' : i < 3 ? 'text-white' : 'text-subtle'}`}>
                        {s.position}
                      </span>

                      <div className="w-8 h-8 rounded-full bg-card-hover border border-line overflow-hidden shrink-0">
                        {photo ? (
                          <img src={photo} alt={d.familyName} loading="lazy" className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-subtle">{d.givenName?.[0]}{d.familyName?.[0]}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link to={`/pilotes/${d.driverId}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors">
                          {d.givenName} <span className="font-black">{d.familyName}</span>
                        </Link>
                        <p className="text-xs truncate" style={{ color: tc?.hex ?? '#a3a3a3' }}>{team}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-white tabular-nums">{s.points}</p>
                        <p className="text-[10px] text-subtle">pts</p>
                      </div>

                      {parseInt(s.wins) > 0 && (
                        <div className="text-right shrink-0 w-10">
                          <p className="text-sm font-bold text-muted tabular-nums">{s.wins}</p>
                          <p className="text-[10px] text-subtle">wins</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-subtle">No driver standings available.</p>
            )
          )}

          {/* Constructor standings */}
          {tab === 'constructors' && (
            constructorStandings?.ConstructorStandings?.length > 0 ? (
              <div className="rounded-lg border border-line overflow-hidden">
                {constructorStandings.ConstructorStandings.map((s, i) => {
                  const team = s.Constructor.name
                  const tc = getTeamColor(team)
                  const tp = getTeamPhoto(team)

                  return (
                    <div
                      key={s.Constructor.constructorId}
                      className={`flex items-center gap-4 px-4 py-4 border-b border-line last:border-0 hover:bg-card-hover transition-colors ${i < 3 ? 'bg-card' : ''}`}
                    >
                      <span className={`w-6 text-sm font-black tabular-nums text-right shrink-0 ${i === 0 ? 'text-star' : i < 3 ? 'text-white' : 'text-subtle'}`}>
                        {s.position}
                      </span>

                      <div
                        className="w-3 h-8 rounded-sm shrink-0"
                        style={{ backgroundColor: tc?.hex ?? '#525252' }}
                      />

                      {tp && (
                        <img src={tp} alt={team} className="h-6 w-auto object-contain shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white">{team}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-white tabular-nums">{s.points}</p>
                        <p className="text-[10px] text-subtle">pts</p>
                      </div>

                      {parseInt(s.wins) > 0 && (
                        <div className="text-right shrink-0 w-10">
                          <p className="text-sm font-bold text-muted tabular-nums">{s.wins}</p>
                          <p className="text-[10px] text-subtle">wins</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-subtle">No constructor standings available.</p>
            )
          )}
        </section>

        {/* ── Top Rated Races ── */}
        {topRatedRaces.length > 0 && (
          <section>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white mb-5">Top Rated Races</h2>
            <div className="rounded-lg border border-line overflow-hidden">
              {topRatedRaces.map((race, i) => (
                <Link
                  key={race.id}
                  to={`/gps/${season}/${race.slug}`}
                  className="flex items-center gap-4 px-4 py-3 border-b border-line last:border-0 hover:bg-card-hover transition-colors"
                >
                  <span className={`w-6 text-sm font-black tabular-nums text-right shrink-0 ${i === 0 ? 'text-star' : 'text-subtle'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{race.name}</p>
                    <p className="text-xs text-subtle">{race.country}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-star tabular-nums">{race.avg}</p>
                    <p className="text-[10px] text-subtle">{race.ratingCount} rating{race.ratingCount !== 1 ? 's' : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Link to races ── */}
        <div className="flex items-center gap-4">
          <Link
            to={`/gps`}
            className="text-sm text-muted hover:text-white transition-colors underline underline-offset-4"
          >
            Browse all {annee} races →
          </Link>
        </div>

      </div>
    </div>
  )
}
