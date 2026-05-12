import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { TODAY, FIRST_SEASON } from '../lib/constants'
import { computeAvgRating } from '../lib/ratingUtils'

function buildSeasonsList(latestSeason) {
  const seasons = []
  for (let y = latestSeason; y >= FIRST_SEASON; y--) seasons.push(y)
  return seasons
}

export default function GrandsPrix() {
  const { loading: authLoading } = useAuth()
  const [seasons, setSeasons] = useState(() => buildSeasonsList(new Date().getFullYear()))
  const [saisonActive, setSaisonActive] = useState(seasons[0])
  const [sortMode, setSortMode] = useState('latest')
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Detect latest season with data
  useEffect(() => {
    if (authLoading) return

    supabase
      .from('races')
      .select('season')
      .lt('date', TODAY)
      .order('season', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          const latest = data[0].season
          setSeasons(buildSeasonsList(latest))
          setSaisonActive(latest)
        }
      })
  }, [authLoading])

  useEffect(() => {
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      let racesQuery = supabase
        .from('races')
        .select('id, season, round, name, slug, circuit, country, date, poster_url, race_type')
        .lt('date', TODAY)
        .order('date', { ascending: false })

      if (saisonActive !== 0) racesQuery = racesQuery.eq('season', saisonActive)

      const { data: racesData, error: racesError } = await racesQuery

      if (racesError) {
        setError(racesError.message)
        setLoading(false)
        return
      }

      const races = racesData ?? []

      if (races.length === 0) {
        setGps([])
        setLoading(false)
        return
      }

      const raceIds = races.map((r) => r.id)

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('race_id, score')
        .in('race_id', raceIds)

      const ratings = ratingsData ?? []

      const ratingsByRace = {}
      for (const rating of ratings) {
        if (!ratingsByRace[rating.race_id]) ratingsByRace[rating.race_id] = []
        ratingsByRace[rating.race_id].push(rating.score)
      }

      const enriched = races.map((gp) => {
        const scores = ratingsByRace[gp.id] ?? []
        return {
          ...gp,
          posterUrl: gp.poster_url,
          raceType: gp.race_type,
          avgRating: computeAvgRating(scores),
          reviewCount: scores.length,
        }
      })

      setGps(enriched)
      setLoading(false)
    }

    fetchData()
  }, [saisonActive])

  const gpsDisplay = useMemo(() => {
    if (sortMode === 'best') return [...gps].filter((g) => g.avgRating !== null).sort((a, b) => b.avgRating - a.avgRating)
    if (sortMode === 'worst') return [...gps].filter((g) => g.avgRating !== null).sort((a, b) => a.avgRating - b.avgRating)
    if (sortMode === 'popular') return [...gps].sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    return gps
  }, [gps, sortMode])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Grands Prix</h1>
        <p className="text-sm text-muted mt-1">
          {loading ? 'Loading…' : `${gpsDisplay.length} races · ${saisonActive === 0 ? 'All time' : `${saisonActive} season`}`}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <select
          value={saisonActive}
          onChange={(e) => setSaisonActive(Number(e.target.value))}
          className="appearance-none cursor-pointer rounded-lg bg-card border border-line text-white text-sm font-medium px-4 py-2 pr-8 hover:border-subtle focus:outline-none focus:border-f1-red transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a3a3a3' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
        >
          <option value={0}>All time</option>
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1">
          {[
            { key: 'latest', label: 'Latest' },
            { key: 'best', label: 'Best' },
            { key: 'worst', label: 'Worst' },
            { key: 'popular', label: 'Most reviewed' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${sortMode === opt.key ? 'bg-card-hover text-white' : 'text-subtle hover:text-muted'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {saisonActive !== 0 && (
          <Link to={`/saisons/${saisonActive}`} className="ml-auto text-sm text-muted hover:text-white transition-colors shrink-0">
            {saisonActive} season overview →
          </Link>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-20 text-muted">
          <p>Error: {error}</p>
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-muted">
          <p>Loading…</p>
        </div>
      ) : gpsDisplay.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gpsDisplay.map((gp) => (
            <GPCard key={gp.id} gp={gp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted">
          {sortMode === 'best' || sortMode === 'worst'
            ? <p>No rated GPs for this selection.</p>
            : <p>No Grand Prix found for the {saisonActive === 0 ? 'selected filters' : `${saisonActive} season`}.</p>
          }
        </div>
      )}

    </div>
  )
}
