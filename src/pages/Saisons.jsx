import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getDriverStandings } from '../lib/f1api'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'
import { TODAY, FIRST_SEASON } from '../lib/constants'
import { computeAvgRating } from '../lib/ratingUtils'

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

    async function load() {
      // Fetch race counts and avg ratings per season (parallel)
      const [{ data: racesData }, { data: ratingsData }] = await Promise.all([
        supabase.from('races').select('id, season').eq('race_type', 'race').lt('date', TODAY),
        supabase.from('ratings').select('score, race_id'),
      ])

      const racesBySeason = {}
      const raceIdToSeason = {}
      for (const r of racesData ?? []) {
        racesBySeason[r.season] = (racesBySeason[r.season] ?? 0) + 1
        raceIdToSeason[r.id] = r.season
      }

      const scoresBySeason = {}
      for (const r of ratingsData ?? []) {
        const season = raceIdToSeason[r.race_id]
        if (!season) continue
        if (!scoresBySeason[season]) scoresBySeason[season] = []
        scoresBySeason[season].push(r.score)
      }

      const maxSeason = Math.max(...Object.keys(racesBySeason).map(Number), FIRST_SEASON)

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
        const scores = scoresBySeason[y] ?? []
        seasons.push({
          year: y,
          raceCount: racesBySeason[y] ?? 0,
          avgRating: computeAvgRating(scores),
          ratingCount: scores.length,
          champion: CHAMPIONS[y] ?? null,
          leader: leaders[y] ?? null,
        })
      }

      setSeasonsData(seasons)
      setLoading(false)
    }

    load()
  }, [authLoading])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white">Seasons</h1>
        <p className="text-sm text-muted mt-1">F1 from 2000 to present</p>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {seasonsData.map((s) => {
            const featured = s.champion ?? s.leader
            const teamColor = getTeamColor(featured?.team)
            const teamPhoto = getTeamPhoto(featured?.team)

            return (
              <Link
                key={s.year}
                to={`/saisons/${s.year}`}
                className="group relative rounded-lg overflow-hidden bg-card border border-line transition-all duration-200 hover:border-subtle hover:scale-[1.01]"
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
                    <span className="text-3xl font-black text-white group-hover:text-f1-red transition-colors">{s.year}</span>
                    {!s.champion && (
                      <span className="text-[10px] font-medium text-subtle border border-line rounded px-1.5 py-px">In progress</span>
                    )}
                  </div>

                  {/* Champion / Leader */}
                  {featured ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle mb-1">
                        {s.champion ? 'Champion' : 'Leader'}
                      </p>
                      <p className="text-sm font-bold text-white leading-snug">
                        {featured.driver}
                        {s.leader && !s.champion && featured.points && (
                          <span className="text-xs font-normal text-subtle ml-1.5">{featured.points} pts</span>
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
                  <div className="flex items-center gap-3 text-[11px] text-subtle pt-0.5">
                    <span>{s.raceCount} races</span>
                    {s.avgRating != null && (
                      <>
                        <span>·</span>
                        <span className="text-star">★ {s.avgRating}</span>
                        <span className="text-subtle">({s.ratingCount})</span>
                      </>
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
