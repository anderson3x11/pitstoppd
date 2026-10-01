import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import Icon from '../components/Icon'
import Segmented from '../components/Segmented'
import { SkeletonGPCard } from '../components/Skeleton'
import { EmptyState } from '../components/PageState'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { FIRST_SEASON } from '../lib/constants'
import { getPageCache, setPageCache } from '../lib/pageCache'

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
    api('/races').then(({ latestSeason }) => {
      if (!latestSeason) return
      setSeasons(buildSeasonsList(latestSeason))
      setSaisonActive(latestSeason)
    }).catch(() => {})
  }, [authLoading])

  useEffect(() => {
    const cached = getPageCache(`gps:${saisonActive}`)
    if (cached) {
      setGps(cached)
      setLoading(false)
    } else {
      setLoading(true)
    }
    setError(null)

    const fetchData = async () => {
      try {
        const { races } = await api(`/races?season=${saisonActive}`)
        const enriched = races.map((gp) => ({ ...gp, posterUrl: gp.poster_url, raceType: gp.race_type }))
        setGps(enriched)
        setPageCache(`gps:${saisonActive}`, enriched)
      } catch (err) {
        setError(err.message)
      }
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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Grands Prix</h1>
          <p className="text-muted mt-2">
            {loading ? ' ' : `${gpsDisplay.length} ${gpsDisplay.length === 1 ? 'race' : 'races'} · ${saisonActive === 0 ? 'every season' : `${saisonActive} season`}`}
          </p>
        </div>
        {saisonActive !== 0 && (
          <Link to={`/saisons/${saisonActive}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors">
            {saisonActive} standings <Icon name="arrowRight" className="w-3.5 h-3.5" />
          </Link>
        )}
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-line pb-5">
        <label className="relative">
          <span className="sr-only">Season</span>
          <select
            value={saisonActive}
            onChange={(e) => setSaisonActive(Number(e.target.value))}
            className="field appearance-none cursor-pointer w-auto! pr-9 font-medium"
          >
            <option value={0}>All seasons</option>
            {seasons.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Icon name="chevronDown" className="w-4 h-4 text-subtle absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </label>
        <Segmented
          label="Sort races"
          value={sortMode}
          onChange={setSortMode}
          options={[
            { key: 'latest', label: 'Latest' },
            { key: 'best', label: 'Highest rated' },
            { key: 'worst', label: 'Lowest rated' },
            { key: 'popular', label: 'Most rated' },
          ]}
        />
      </div>

      {error ? (
        <EmptyState title="Couldn't load the races">{error}. Reload the page to try again.</EmptyState>
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
          {Array.from({ length: 10 }, (_, i) => <SkeletonGPCard key={i} />)}
        </div>
      ) : gpsDisplay.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
          {gpsDisplay.map((gp) => <GPCard key={gp.id} gp={gp} />)}
        </div>
      ) : (
        <EmptyState title={sortMode === 'best' || sortMode === 'worst' ? 'No rated races yet' : 'No races found'}>
          {sortMode === 'best' || sortMode === 'worst'
            ? 'Nobody has rated a race from this selection. Switch to Latest to browse them.'
            : `No Grand Prix has been raced in ${saisonActive === 0 ? 'this selection' : saisonActive} yet.`}
        </EmptyState>
      )}
    </div>
  )
}
