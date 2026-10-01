import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon'
import { Skeleton } from '../components/Skeleton'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { getDriverStandings } from '../lib/f1api'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'
import { FIRST_SEASON } from '../lib/constants'
import { getPageCache, setPageCache } from '../lib/pageCache'

const CHAMPIONS = {
  2025: { driver: 'Lando Norris', team: 'McLaren' },
  2024: { driver: 'Max Verstappen', team: 'Red Bull' },
  2023: { driver: 'Max Verstappen', team: 'Red Bull' },
  2022: { driver: 'Max Verstappen', team: 'Red Bull' },
  2021: { driver: 'Max Verstappen', team: 'Red Bull' },
  2020: { driver: 'Lewis Hamilton', team: 'Mercedes' },
  2019: { driver: 'Lewis Hamilton', team: 'Mercedes' },
  2018: { driver: 'Lewis Hamilton', team: 'Mercedes' },
  2017: { driver: 'Lewis Hamilton', team: 'Mercedes' },
  2016: { driver: 'Nico Rosberg', team: 'Mercedes' },
  2015: { driver: 'Lewis Hamilton', team: 'Mercedes' },
  2014: { driver: 'Lewis Hamilton', team: 'Mercedes' },
  2013: { driver: 'Sebastian Vettel', team: 'Red Bull' },
  2012: { driver: 'Sebastian Vettel', team: 'Red Bull' },
  2011: { driver: 'Sebastian Vettel', team: 'Red Bull' },
  2010: { driver: 'Sebastian Vettel', team: 'Red Bull' },
  2009: { driver: 'Jenson Button', team: 'Brawn' },
  2008: { driver: 'Lewis Hamilton', team: 'McLaren' },
  2007: { driver: 'Kimi Räikkönen', team: 'Ferrari' },
  2006: { driver: 'Fernando Alonso', team: 'Renault' },
  2005: { driver: 'Fernando Alonso', team: 'Renault' },
  2004: { driver: 'Michael Schumacher', team: 'Ferrari' },
  2003: { driver: 'Michael Schumacher', team: 'Ferrari' },
  2002: { driver: 'Michael Schumacher', team: 'Ferrari' },
  2001: { driver: 'Michael Schumacher', team: 'Ferrari' },
  2000: { driver: 'Michael Schumacher', team: 'Ferrari' },
}

export default function Saisons() {
  const { loading: authLoading } = useAuth()
  const [seasonsData, setSeasonsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const cached = getPageCache('saisons')
    if (cached) {
      setSeasonsData(cached)
      setLoading(false)
    }

    async function load() {
      const stats = await api('/seasons')
      const statsByYear = Object.fromEntries(stats.map((st) => [st.year, st]))

      const maxSeason = Math.max(...stats.map((st) => st.year), FIRST_SEASON)

      // Fetch standings for seasons without a champion (current/in-progress) — parallel
      const leaders = {}
      const missingYears = []
      for (let y = maxSeason; y >= FIRST_SEASON; y--) {
        if (!CHAMPIONS[y]) missingYears.push(y)
      }
      await Promise.all(missingYears.map(async (y) => {
        try {
          const standings = await getDriverStandings(y)
          const leader = standings?.DriverStandings?.[0]
          if (leader) {
            leaders[y] = {
              driver: `${leader.Driver.givenName} ${leader.Driver.familyName}`,
              team: leader.Constructors?.[0]?.name,
              points: leader.points,
            }
          }
        } catch { /* no standings yet */ }
      }))

      const seasons = []
      for (let y = maxSeason; y >= FIRST_SEASON; y--) {
        seasons.push({
          year: y,
          raceCount: statsByYear[y]?.raceCount ?? 0,
          avgRating: statsByYear[y]?.avgRating ?? null,
          ratingCount: statsByYear[y]?.ratingCount ?? 0,
          champion: CHAMPIONS[y] ?? null,
          leader: leaders[y] ?? null,
        })
      }

      setSeasonsData(seasons)
      setPageCache('saisons', seasons)
      setLoading(false)
    }

    load().catch(() => setLoading(false))
  }, [authLoading])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="page-title">Seasons</h1>
        <p className="text-muted mt-2">Every championship since 2000, with its champion and how fans rated it.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {seasonsData.map((s) => {
            const featured = s.champion ?? s.leader
            const teamColor = getTeamColor(featured?.team)
            const teamPhoto = getTeamPhoto(featured?.team)

            return (
              <Link
                key={s.year}
                to={`/saisons/${s.year}`}
                className="group relative rounded-lg overflow-hidden bg-card border border-line transition-[border-color,transform] duration-200 ease-[var(--ease-out)] hover:border-line-strong hover:-translate-y-0.5"
              >
                {/* Team color strip */}
                {teamColor && (
                  <div className="h-0.5" style={{ background: teamColor.hex }} />
                )}

                {teamPhoto && (
                  <div className="absolute top-4 right-3 pointer-events-none select-none">
                    <img src={teamPhoto} alt="" loading="lazy" className="h-7 w-auto object-contain opacity-10 group-hover:opacity-20 transition-opacity" />
                  </div>
                )}

                <div className="relative px-5 py-4 space-y-2.5">
                  {/* Year */}
                  <div className="flex items-center gap-2">
                    <span className="font-display text-4xl font-bold text-white group-hover:text-f1-red transition-colors">{s.year}</span>
                    {!s.champion && (
                      <span className="text-xs font-medium text-f1-red border border-f1-red/40 rounded-sm px-1.5 py-px">Live</span>
                    )}
                  </div>

                  {/* Champion / Leader */}
                  {featured ? (
                    <div>
                      <p className="text-xs text-subtle mb-0.5">
                        {s.champion ? 'Champion' : 'Leader'}
                      </p>
                      <p className="text-sm font-bold text-white leading-snug">
                        {featured.driver}
                        {s.leader && !s.champion && featured.points && (
                          <span className="text-xs font-normal text-subtle ml-1.5 tabular-nums">{featured.points} pts</span>
                        )}
                      </p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: teamColor?.hex ?? '#a3a3a3' }}>
                        {featured.team}
                      </p>
                    </div>
                  ) : (
                    <div className="h-10" />
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-xs text-subtle pt-1 border-t border-line">
                    <span className="pt-2">{s.raceCount} races</span>
                    {s.avgRating != null && (
                      <span className="pt-2 ml-auto flex items-center gap-1 tabular-nums" aria-label={`Average rating ${s.avgRating} from ${s.ratingCount} ratings`}>
                        <Icon name="star" filled className="w-3.5 h-3.5 text-star" />
                        <span className="text-muted font-medium">{s.avgRating.toFixed(1)}</span>
                        <span>({s.ratingCount})</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
