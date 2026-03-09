import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getCountryFlag } from '../lib/countryFlags'

const TODAY = new Date().toISOString().split('T')[0]

function FeedCard({ review }) {
  const [spoilerVisible, setSpoilerVisible] = useState(false)

  const formattedDate = new Date(review.created_at).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="rounded-lg border border-line bg-card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <Link to={`/${review.username}`} className="text-sm font-semibold text-white hover:text-f1-red transition-colors">
            {review.displayName}
          </Link>
          <p className="text-xs text-subtle">
            <Link to={`/gps/${review.raceSeason}/${review.raceSlug}`} className="hover:text-white transition-colors">
              {review.raceName}
            </Link>
            {' · '}{formattedDate}
          </p>
        </div>
        {review.rating != null && <StarRating value={review.rating} size="sm" showValue />}
      </div>

      {review.spoiler && !spoilerVisible ? (
        <div className="rounded bg-card-hover border border-line px-3 py-2 text-center">
          <p className="text-xs text-subtle mb-1">Contains spoilers</p>
          <button
            onClick={() => setSpoilerVisible(true)}
            className="text-xs font-medium text-muted hover:text-white transition-colors"
          >
            Show anyway
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted leading-relaxed line-clamp-3">{review.content}</p>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const [gps, setGps] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedReviews, setFeedReviews] = useState([])
  const [feedLoading, setFeedLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('races')
      .select('id, season, round, name, slug, circuit, country, date, poster_url')
      .lt('date', TODAY)
      .order('date', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        setGps(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!user) { setFeedReviews([]); return }

    setFeedLoading(true)

    async function loadFeed() {
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      if (!followsData?.length) { setFeedLoading(false); return }

      const followingIds = followsData.map((f) => f.following_id)

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('id, content, spoiler, created_at, user_id, race_id, races(name, season, slug)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(9)

      if (!reviewsData?.length) { setFeedLoading(false); return }

      const userIds = [...new Set(reviewsData.map((r) => r.user_id))]
      const raceIds = [...new Set(reviewsData.map((r) => r.race_id).filter(Boolean))]

      const [{ data: profilesData }, { data: ratingsData }] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name').in('id', userIds),
        supabase.from('ratings').select('user_id, race_id, score').in('user_id', userIds).in('race_id', raceIds),
      ])

      const profileMap = {}
      for (const p of profilesData ?? []) profileMap[p.id] = p

      const ratingMap = {}
      for (const r of ratingsData ?? []) ratingMap[`${r.user_id}_${r.race_id}`] = r.score

      setFeedReviews(reviewsData.map((r) => ({
        id: r.id,
        content: r.content,
        spoiler: r.spoiler,
        created_at: r.created_at,
        username: profileMap[r.user_id]?.username,
        displayName: profileMap[r.user_id]?.display_name,
        raceName: r.races?.name,
        raceSeason: r.races?.season,
        raceSlug: r.races?.slug,
        rating: ratingMap[`${r.user_id}_${r.race_id}`] ?? null,
      })))

      setFeedLoading(false)
    }

    loadFeed()
  }, [user])

  const gpCards = gps.map((gp) => ({ ...gp, posterUrl: gp.poster_url, avgRating: null, reviewCount: null }))
  const latestGP = gpCards[0] ?? null

  return (
    <div>
      {/* ── Hero: latest GP featured ── */}
      <section className="relative border-b border-line">
        {/* CSS background */}
        <div className="absolute inset-0 bg-gradient-to-br from-card-hover via-card to-page" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 15% 60%, rgba(232, 0, 45, 0.07) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-page via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 flex items-end gap-8">
          {/* Poster */}
          <div className="hidden sm:block w-40 shrink-0 rounded-lg overflow-hidden border border-white/10 shadow-2xl aspect-[2/3] bg-card-hover">
            {latestGP?.posterUrl ? (
              <img src={latestGP.posterUrl} alt={latestGP.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card">
                <span className="text-5xl">{getCountryFlag(latestGP?.country)}</span>
                <span className="text-center text-[11px] font-medium text-subtle uppercase tracking-wide leading-tight px-2">
                  {latestGP?.name}
                </span>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="space-y-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="block w-6 h-px bg-f1-red" />
              <p className="text-xs font-semibold uppercase tracking-widest text-f1-red">Latest Grand Prix</p>
            </div>
            {loading ? (
              <p className="text-muted text-sm">Loading…</p>
            ) : latestGP ? (
              <>
                <h1 className="text-4xl font-black text-white leading-tight">{latestGP.name}</h1>
                <p className="text-sm text-muted">
                  {latestGP.season}
                  {latestGP.circuit && <> · {latestGP.circuit}</>}
                  {latestGP.country && <> · {latestGP.country}</>}
                </p>
                <div className="pt-1">
                  <Link
                    to={`/gps/${latestGP.season}/${latestGP.slug}`}
                    className="inline-flex items-center gap-1.5 rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors"
                  >
                    View Grand Prix →
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-muted text-sm">No Grand Prix available.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 space-y-14">

        {/* ── Friends' Reviews ── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Friends' Reviews</h2>
          {user ? (
            feedLoading ? (
              <p className="text-muted text-sm">Loading…</p>
            ) : feedReviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedReviews.map((r) => <FeedCard key={r.id} review={r} />)}
              </div>
            ) : (
              <div className="rounded-lg border border-line bg-card p-6 text-center space-y-2">
                <p className="text-sm text-muted">No recent reviews.</p>
                <p className="text-xs text-subtle">Follow users to see their reviews here.</p>
              </div>
            )
          ) : (
            <div className="rounded-lg border border-line bg-card p-8 text-center space-y-3">
              <p className="text-white font-semibold">Join the community</p>
              <p className="text-sm text-muted max-w-sm mx-auto">
                Sign in to see ratings and reviews from users you follow.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link to="/register" className="rounded bg-f1-red px-4 py-2 text-sm font-semibold text-white hover:bg-f1-red-hover transition-colors">
                  Create account
                </Link>
                <Link to="/login" className="text-sm font-medium text-muted hover:text-white transition-colors">
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── Latest Grand Prix ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Latest Grand Prix</h2>
            <Link to="/gps" className="text-sm text-muted hover:text-white transition-colors">View all →</Link>
          </div>
          {loading ? (
            <p className="text-muted text-sm">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {gpCards.map((gp) => <GPCard key={gp.id} gp={gp} />)}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
