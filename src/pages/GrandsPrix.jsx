import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import { supabase } from '../lib/supabase'

const TODAY = new Date().toISOString().split('T')[0]
const FIRST_SEASON = 2000

function buildSeasonsList(latestSeason) {
  const seasons = []
  for (let y = latestSeason; y >= FIRST_SEASON; y--) seasons.push(y)
  return seasons
}

export default function GrandsPrix() {
  const [seasons, setSeasons] = useState(() => buildSeasonsList(new Date().getFullYear()))
  const [saisonActive, setSaisonActive] = useState(seasons[0])
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Detect latest season with data
  useEffect(() => {
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
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    const fetchData = async () => {
      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('id, season, round, name, slug, circuit, country, date, poster_url, race_type')
        .eq('season', saisonActive)
        .lt('date', TODAY)
        .order('date', { ascending: false })

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

      // Group ratings by race_id
      const ratingsByRace = {}
      for (const rating of ratings) {
        if (!ratingsByRace[rating.race_id]) ratingsByRace[rating.race_id] = []
        ratingsByRace[rating.race_id].push(rating.score)
      }

      const enriched = races.map((gp) => {
        const scores = ratingsByRace[gp.id] ?? []
        const reviewCount = scores.length
        const avgRating =
          reviewCount > 0
            ? Math.round((scores.reduce((sum, s) => sum + s, 0) / reviewCount) * 10) / 10
            : null

        return {
          ...gp,
          posterUrl: gp.poster_url,
          raceType: gp.race_type,
          avgRating,
          reviewCount,
        }
      })

      setGps(enriched)
      setLoading(false)
    }

    fetchData()
  }, [saisonActive])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Grands Prix</h1>
        <p className="text-sm text-muted mt-1">
          {loading ? 'Loading…' : `${gps.length} races · ${saisonActive} season`}
        </p>
      </div>

      {/* Season filter */}
      <div className="mb-8">
        <select
          value={saisonActive}
          onChange={(e) => setSaisonActive(Number(e.target.value))}
          className="appearance-none cursor-pointer rounded-lg bg-card border border-line text-white text-sm font-medium px-4 py-2 pr-8 hover:border-subtle focus:outline-none focus:border-f1-red transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a3a3a3' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
        >
          {seasons.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Link to season page */}
      <div className="mb-6">
        <Link
          to={`/saisons/${saisonActive}`}
          className="text-sm text-muted hover:text-white transition-colors"
        >
          View {saisonActive} season overview →
        </Link>
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
      ) : gps.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {gps.map((gp) => (
            <GPCard key={gp.id} gp={gp} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted">
          <p>No Grand Prix found for the {saisonActive} season.</p>
        </div>
      )}

    </div>
  )
}
