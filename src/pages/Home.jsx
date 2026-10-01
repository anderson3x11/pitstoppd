import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import Poster from '../components/Poster'
import StarRating from '../components/StarRating'
import Icon from '../components/Icon'
import { Skeleton, SkeletonGPCard, SkeletonHero, SkeletonFeedCard } from '../components/Skeleton'
import { EmptyState } from '../components/PageState'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { formatDateLong } from '../lib/dateUtils'
import { TODAY } from '../lib/constants'
import { getPageCache, setPageCache } from '../lib/pageCache'

function FeedCard({ entry }) {
  return (
    <Link
      to={`/gps/${entry.raceSeason}/${entry.raceSlug}`}
      className="group flex gap-3 rounded-lg border border-line bg-card p-2.5 hover:border-line-strong hover:bg-card-hover transition-colors"
    >
      <Poster race={{ name: entry.raceName, season: entry.raceSeason, poster_url: entry.posterUrl }} className="w-14 shrink-0" />
      <div className="min-w-0 flex flex-col justify-center gap-1">
        <p className="text-sm font-semibold text-white truncate group-hover:text-f1-red transition-colors">{entry.raceName}</p>
        <p className="text-xs text-subtle truncate">
          <span className="text-muted">{entry.displayName}</span> · {entry.raceSeason}
        </p>
        {entry.rating != null && <StarRating value={entry.rating} size="sm" />}
      </div>
    </Link>
  )
}

// Composant isolé : le tick chaque seconde ne re-render que ce span, pas toute la Home
function Countdown({ date }) {
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const target = new Date(date + 'T12:00:00Z')
    const tick = () => {
      const diff = target - new Date()
      if (diff <= 0) { setCountdown('Race day'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [date])

  if (!countdown) return null
  return <span className="font-mono text-sm font-medium text-white shrink-0 tabular-nums">{countdown}</span>
}

function Hero({ gp, loading }) {
  const isSprint = gp?.race_type === 'sprint'
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      {/* Backdrop : le poster du GP, flouté, comme les backdrops Letterboxd */}
      {gp?.poster_url && (
        <img src={gp.poster_url} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full object-cover scale-110 blur-3xl opacity-30 animate-[fade-in_600ms_ease]" />
      )}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_120%_at_10%_50%,rgba(232,0,45,0.12),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-page/60 to-page/30" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16 flex items-end gap-6 sm:gap-10">
        <div className="w-28 sm:w-44 shrink-0">
          {gp ? <Poster race={gp} eager className="shadow-[0_24px_48px_-16px_rgba(0,0,0,0.9)]" /> : <Skeleton className="aspect-[2/3]" />}
        </div>

        <div className="min-w-0 pb-1">
          {loading ? <SkeletonHero /> : gp ? (
            <>
              <h1 className="font-display font-bold uppercase text-4xl sm:text-6xl md:text-7xl leading-[0.92] tracking-tight text-white pr-2">
                {gp.name}
              </h1>
              <p className="mt-3 text-sm sm:text-base text-muted">
                {isSprint ? 'Sprint' : `Round ${gp.round}`} · {formatDateLong(gp.date)}
                <span className="hidden sm:inline"> · {gp.circuit}</span>
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link to={`/gps/${gp.season}/${gp.slug}`} className="btn btn-primary">
                  {isSprint ? 'Rate this sprint' : 'Rate this race'}
                  <Icon name="arrowRight" />
                </Link>
                {gp.avgRating != null && (
                  <span className="flex items-center gap-2 text-sm text-muted">
                    <StarRating value={gp.avgRating} />
                    <span className="tabular-nums"><span className="font-semibold text-white">{gp.avgRating.toFixed(1)}</span> from {gp.reviewCount} {gp.reviewCount === 1 ? 'rating' : 'ratings'}</span>
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted">No Grand Prix has been raced yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedReviews, setFeedReviews] = useState([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [nextGP, setNextGP] = useState(null)

  useEffect(() => {
    if (authLoading) return

    const cached = getPageCache('home:races')
    if (cached) {
      setGps(cached.gps)
      setNextGP(cached.nextGP)
      setLoading(false)
    }

    async function loadRaces() {
      const { latest, next } = await api('/home')
      setGps(latest)
      setNextGP(next)
      setPageCache('home:races', { gps: latest, nextGP: next })
      setLoading(false)
    }

    loadRaces().catch(() => setLoading(false))
  }, [authLoading])

  useEffect(() => {
    if (authLoading) return
    if (!user) { setFeedReviews([]); return }

    const cachedFeed = getPageCache(`home:feed:${user.id}`)
    if (cachedFeed) setFeedReviews(cachedFeed)
    else setFeedLoading(true)

    async function loadFeed() {
      const feed = await api('/feed')
      setFeedReviews(feed)
      setPageCache(`home:feed:${user.id}`, feed)
      setFeedLoading(false)
    }

    loadFeed().catch(() => setFeedLoading(false))
  }, [user?.id, authLoading])

  const latestGP = gps[0] ?? null
  const gpCards = gps.map((gp) => ({ ...gp, posterUrl: gp.poster_url, raceType: gp.race_type }))
  const daysToNext = nextGP ? Math.ceil((new Date(nextGP.date) - new Date(TODAY)) / 86400000) : null

  return (
    <div>
      <Hero gp={latestGP} loading={loading} />

      {nextGP && (
        <div className="border-b border-line bg-card/60">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${daysToNext <= 7 ? 'bg-f1-red text-white' : 'border border-line-strong text-muted'}`}>
                {daysToNext <= 7 ? 'Race week' : 'Next race'}
              </span>
              <span className="text-sm font-semibold text-white truncate">{nextGP.name}</span>
              <span className="hidden sm:block text-sm text-subtle truncate">{nextGP.country}</span>
            </div>
            <Countdown date={nextGP.date} />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-12 space-y-16">
        <section aria-labelledby="latest-title">
          <div className="flex items-end justify-between gap-4 mb-5 border-b border-line pb-3">
            <h2 id="latest-title" className="section-title">Latest races</h2>
            <Link to="/gps" className="inline-flex items-center gap-1 text-sm text-muted hover:text-white transition-colors">
              All Grands Prix <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-6 sm:gap-x-4">
            {loading
              ? [0, 1, 2, 3, 4, 5].map((i) => <SkeletonGPCard key={i} />)
              : gpCards.map((gp) => <GPCard key={gp.id} gp={gp} />)}
          </div>
        </section>

        <section aria-labelledby="friends-title">
          <div className="flex items-end justify-between gap-4 mb-5 border-b border-line pb-3">
            <h2 id="friends-title" className="section-title">From friends</h2>
          </div>
          {user ? (
            feedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => <SkeletonFeedCard key={i} />)}
              </div>
            ) : feedReviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {feedReviews.map((r) => <FeedCard key={r.id} entry={r} />)}
              </div>
            ) : (
              <EmptyState title="Your feed is quiet" action="Browse Grands Prix" to="/gps">
                Ratings from people you follow show up here. Open a race, read its reviews, and follow the fans you agree with.
              </EmptyState>
            )
          ) : (
            <div className="relative overflow-hidden rounded-lg border border-line bg-card px-6 py-10 sm:px-10">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-f1-red/10 blur-3xl" aria-hidden="true" />
              <h3 className="font-display text-3xl sm:text-4xl font-bold uppercase leading-none text-white max-w-lg">
                Every race you've watched, in one log.
              </h3>
              <p className="mt-3 text-muted max-w-md">
                Rate Grands Prix from 0.5 to 5 stars, write reviews, and follow other fans to see what they thought.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/register" className="btn btn-primary">Create an account</Link>
                <Link to="/login" className="btn btn-secondary">Sign in</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
