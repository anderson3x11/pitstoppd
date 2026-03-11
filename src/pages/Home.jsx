import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GPCard from '../components/GPCard'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getCountryFlag } from '../lib/countryFlags'

const TODAY = new Date().toISOString().split('T')[0]

function FeedCard({ entry }) {
  return (
    <Link to={`/gps/${entry.raceSeason}/${entry.raceSlug}`} className="group rounded-lg border border-line bg-card flex overflow-hidden hover:border-subtle transition-colors">
      {/* Poster */}
      <div className="w-20 shrink-0 bg-card-hover overflow-hidden">
        {entry.posterUrl ? (
          <img src={entry.posterUrl} alt={entry.raceName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-2xl">{getCountryFlag(entry.raceCountry)}</span>
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 px-3 py-3 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-xs text-subtle truncate">{entry.raceName}</p>
          <Link
            to={`/${entry.username}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-white hover:text-f1-red transition-colors truncate block"
          >
            {entry.displayName}
          </Link>
        </div>
        {entry.rating != null && (
          <div className="mt-2">
            <StarRating value={entry.rating} size="sm" showValue />
          </div>
        )}
      </div>
    </Link>
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

      const { data: ratingsData } = await supabase
        .from('ratings')
        .select('id, score, created_at, user_id, race_id, races(name, season, slug, poster_url, country)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(6)

      if (!ratingsData?.length) { setFeedLoading(false); return }

      const userIds = [...new Set(ratingsData.map((r) => r.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles').select('id, username, display_name').in('id', userIds)

      const profileMap = {}
      for (const p of profilesData ?? []) profileMap[p.id] = p

      setFeedReviews(ratingsData.map((r) => ({
        id: r.id,
        created_at: r.created_at,
        username: profileMap[r.user_id]?.username,
        displayName: profileMap[r.user_id]?.display_name,
        raceName: r.races?.name,
        raceSeason: r.races?.season,
        raceSlug: r.races?.slug,
        posterUrl: r.races?.poster_url ?? null,
        raceCountry: r.races?.country ?? null,
        rating: r.score,
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

        {/* ── Following ── */}
        <section>
          <h2 className="text-lg font-bold mb-4">Following</h2>
          {user ? (
            feedLoading ? (
              <p className="text-muted text-sm">Loading…</p>
            ) : feedReviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedReviews.map((r) => <FeedCard key={r.id} entry={r} />)}
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
