import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getDriverStandings } from '../lib/f1api'
import { getTeamColor } from '../lib/teamColors'
import { getTeamPhoto } from '../lib/teamPhotos'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_SEASON = 2000

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
  const [seasonsData, setSeasonsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

      // Fetch standings for seasons without a champion (current/in-progress)
      const leaders = {}
      for (let y = maxSeason; y >= FIRST_SEASON; y--) {
        if (!CHAMPIONS[y]) {
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
        }
      }

      const seasons = []
      for (let y = maxSeason; y >= FIRST_SEASON; y--) {
        const scores = scoresBySeason[y] ?? []
        const avg = scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null
        seasons.push({
          year: y,
          raceCount: racesBySeason[y] ?? 0,
          avgRating: avg,
          ratingCount: scores.length,
          champion: CHAMPIONS[y] ?? null,
          leader: leaders[y] ?? null,
        })
      }

      setSeasonsData(seasons)
      setLoading(false)
    }

    load()
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white">Seasons</h1>
        <p className="text-sm text-muted mt-1">F1 from 2000 to present</p>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {seasonsData.map((s) => {
            const featured = s.champion ?? s.leader
            const teamColor = getTeamColor(featured?.team)
            const teamPhoto = getTeamPhoto(featured?.team)
            const bgGradient = teamColor
              ? `linear-gradient(135deg, rgba(${teamColor.rgb[0]},${teamColor.rgb[1]},${teamColor.rgb[2]},0.12) 0%, #141414 60%)`
              : '#141414'
            const borderColor = teamColor ? `${teamColor.hex}40` : '#262626'

            return (
              <Link
                key={s.year}
                to={`/saisons/${s.year}`}
                className="group relative rounded-xl border overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                style={{ borderColor, background: bgGradient }}
              >
                {/* Team logo watermark */}
                {teamPhoto && (
                  <div className="absolute top-4 right-4 pointer-events-none select-none">
                    <img src={teamPhoto} alt="" className="h-10 w-auto object-contain opacity-15 group-hover:opacity-25 transition-opacity" />
                  </div>
                )}

                <div className="relative px-6 py-6 space-y-4">
                  {/* Year */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-white group-hover:text-f1-red transition-colors">{s.year}</span>
                    {!s.champion && (
                      <span className="text-xs font-medium text-subtle border border-line rounded px-2 py-0.5">In progress</span>
                    )}
                  </div>

                  {/* Champion or Leader */}
                  {featured && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-subtle">
                        {s.champion ? 'Champion' : 'Leader'}
                      </span>
                      <div className="h-px flex-1 bg-line" />
                    </div>
                  )}
                  {featured && (
                    <div>
                      <p className="text-lg font-black text-white">
                        {featured.driver}
                        {s.leader && !s.champion && featured.points && (
                          <span className="text-sm font-bold text-muted ml-2">{featured.points} pts</span>
                        )}
                      </p>
                      <p className="text-sm text-muted" style={{ color: teamColor?.hex }}>{featured.team}</p>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-5 pt-1">
                    <div>
                      <p className="text-xl font-black text-white">{s.raceCount}</p>
                      <p className="text-[10px] text-subtle uppercase tracking-wide">Races</p>
                    </div>
                    {s.avgRating != null && (
                      <div>
                        <p className="text-xl font-black text-star">{s.avgRating}</p>
                        <p className="text-[10px] text-subtle uppercase tracking-wide">{s.ratingCount} ratings</p>
                      </div>
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
