import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Icon from '../components/Icon'
import Segmented from '../components/Segmented'
import { PageSkeleton, EmptyState } from '../components/PageState'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { getDriverStandings, getConstructorStandings } from '../lib/f1api'
import { getDriverPhoto } from '../lib/driverPhotos'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'
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
      // Classements (proxy Jolpica) + stats de notes (API) en parallèle
      const [driverRes, constructorRes, { seasonStats: stats, topRatedRaces: topRated }] = await Promise.all([
        getDriverStandings(season).catch(() => null),
        getConstructorStandings(season).catch(() => null),
        api(`/seasons/${season}`),
      ])

      setDriverStandings(driverRes)
      setConstructorStandings(constructorRes)
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

    load().catch(() => setLoading(false))
  }, [season, authLoading])

  if (loading) return <PageSkeleton />
  if (!seasonStats && !driverStandings) return <EmptyState page title={`No data for ${annee}`} action="All seasons" to="/saisons">This season isn't covered. Pitstoppd tracks every season from 2000.</EmptyState>

  const champion = driverStandings?.DriverStandings?.[0]
  const championTeam = champion?.Constructors?.[0]?.name
  const teamColor = getTeamColor(championTeam)
  const teamPhoto = getTeamPhoto(championTeam)
  const inProgress = season >= new Date().getFullYear()

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-line bg-card/40">
        {/* Bande plate couleur équipe championne */}
        <div className="h-1" style={{ background: teamColor?.hex ?? 'var(--color-f1-red)' }} />

        {teamPhoto && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="mx-auto max-w-6xl px-4 h-full flex items-center justify-end">
              <img src={teamPhoto} alt="" className="h-48 w-auto object-contain opacity-[0.06]" />
            </div>
          </div>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-subtle mb-3">
            <Link to="/saisons" className="hover:text-white transition-colors">Seasons</Link>
            <span aria-hidden="true">/</span>
            <span className="text-muted">{annee}</span>
          </nav>

          <h1 className="font-display font-bold text-5xl sm:text-7xl uppercase tracking-tight text-white leading-none mb-4 pr-3">{annee} season</h1>

          {champion && (
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-6">
              <span className="text-sm text-muted">{inProgress ? 'Championship leader' : 'World champion'}</span>
              <span className="text-lg font-black text-white">
                {champion.Driver.givenName} {champion.Driver.familyName}
              </span>
              <span className="text-sm text-muted" style={{ color: teamColor?.hex }}>
                {championTeam}
              </span>
            </div>
          )}

          <dl className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {seasonStats && (
              <>
                <div className="flex flex-col-reverse">
                  <dt className="text-sm text-subtle">Races</dt>
                  <dd className="font-display text-3xl font-bold text-white tabular-nums">{seasonStats.raceCount}</dd>
                </div>
                {seasonStats.avgRating != null && (
                  <div className="flex flex-col-reverse">
                    <dt className="text-sm text-subtle">Avg rating</dt>
                    <dd className="font-display text-3xl font-bold text-star tabular-nums">{seasonStats.avgRating}</dd>
                  </div>
                )}
                {seasonStats.totalRatings > 0 && (
                  <div className="flex flex-col-reverse">
                    <dt className="text-sm text-subtle">Total ratings</dt>
                    <dd className="font-display text-3xl font-bold text-white tabular-nums">{seasonStats.totalRatings}</dd>
                  </div>
                )}
                {driverStandings && (
                  <div className="flex flex-col-reverse">
                    <dt className="text-sm text-subtle">Rounds</dt>
                    <dd className="font-display text-3xl font-bold text-white tabular-nums">{driverStandings.round}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 space-y-10">

        {/* ── Standings tabs ── */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3 mb-4">
            <h2 className="section-title">Standings</h2>
            <Segmented label="Standings type" value={tab} onChange={setTab} options={[{ key: 'drivers', label: 'Drivers' }, { key: 'constructors', label: 'Constructors' }]} />
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
                            <span className="text-xs font-bold text-subtle">{d.givenName?.[0]}{d.familyName?.[0]}</span>
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
                        <p className="text-xs text-subtle">pts</p>
                      </div>

                      {parseInt(s.wins) > 0 && (
                        <div className="text-right shrink-0 w-10">
                          <p className="text-sm font-bold text-muted tabular-nums">{s.wins}</p>
                          <p className="text-xs text-subtle">wins</p>
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
                        <p className="text-xs text-subtle">pts</p>
                      </div>

                      {parseInt(s.wins) > 0 && (
                        <div className="text-right shrink-0 w-10">
                          <p className="text-sm font-bold text-muted tabular-nums">{s.wins}</p>
                          <p className="text-xs text-subtle">wins</p>
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
            <h2 className="section-title border-b border-line pb-3 mb-4">Highest rated races</h2>
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
                    <p className="text-sm font-bold text-white tabular-nums flex items-center justify-end gap-1"><Icon name="star" filled className="w-3.5 h-3.5 text-star" />{race.avg.toFixed(1)}</p>
                    <p className="text-xs text-subtle">{race.ratingCount} rating{race.ratingCount !== 1 ? 's' : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}


      </div>
    </div>
  )
}
