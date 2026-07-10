import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import StarRating from '../components/StarRating'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getCountryFlag } from '../lib/countryFlags'

export default function Review() {
  const { saison, slug, username } = useParams()
  const { user, profile } = useAuth()

  const [race, setRace] = useState(null)
  const [review, setReview] = useState(null)
  const [reviewer, setReviewer] = useState(null)
  const [reviewerRating, setReviewerRating] = useState(null)
  const [likers, setLikers] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)

    async function load() {
      // Race et profil du reviewer — indépendants, en parallèle
      const [{ data: raceData }, { data: profileData }] = await Promise.all([
        supabase.from('races').select('*')
          .eq('season', parseInt(saison)).eq('slug', slug).single(),
        supabase.from('profiles').select('id, username, display_name, avatar_url')
          .eq('username', username).maybeSingle(),
      ])

      if (!raceData) { setLoading(false); return }
      setRace(raceData)

      if (!profileData) { setLoading(false); return }
      setReviewer(profileData)

      // Review et note du reviewer — en parallèle
      const [{ data: reviewData }, { data: ratingData }] = await Promise.all([
        supabase.from('reviews').select('id, content, spoiler, created_at')
          .eq('user_id', profileData.id).eq('race_id', raceData.id).maybeSingle(),
        supabase.from('ratings').select('score')
          .eq('user_id', profileData.id).eq('race_id', raceData.id).maybeSingle(),
      ])

      if (!reviewData) { setLoading(false); return }
      setReview(reviewData)
      setReviewerRating(ratingData?.score ?? null)

      // Fetch likes with profiles
      const { data: likesData } = await supabase
        .from('likes').select('user_id')
        .eq('review_id', reviewData.id)

      setLikeCount(likesData?.length ?? 0)

      if (likesData?.length) {
        const likerIds = likesData.map((l) => l.user_id)
        const { data: likerProfiles } = await supabase
          .from('profiles').select('id, username, display_name, avatar_url')
          .in('id', likerIds)
        setLikers(likerProfiles ?? [])

        if (user) {
          setIsLiked(likerIds.includes(user.id))
        }
      }

      setLoading(false)
    }

    load()
  }, [saison, slug, username, user?.id])

  const handleLike = async () => {
    if (!user || !review) return
    if (user.id === reviewer?.id) return

    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('review_id', review.id)
      setIsLiked(false)
      setLikeCount((n) => n - 1)
      setLikers((prev) => prev.filter((l) => l.id !== user.id))
    } else {
      await supabase.from('likes').insert({ user_id: user.id, review_id: review.id })
      setIsLiked(true)
      setLikeCount((n) => n + 1)
      // Profil courant déjà en mémoire via useAuth — pas besoin de re-fetch
      if (profile) setLikers((prev) => [...prev, profile])
    }
  }

  if (loading) return <div className="mx-auto max-w-6xl px-4 py-10"><p className="text-muted text-sm">Loading…</p></div>
  if (!race) return <div className="mx-auto max-w-6xl px-4 py-10"><p className="text-muted text-sm">Grand Prix not found.</p></div>
  if (!review) return <div className="mx-auto max-w-6xl px-4 py-10"><p className="text-muted text-sm">Review not found.</p></div>

  const formattedDate = new Date(race.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">

      {/* ── Header ── */}
      <div className="flex gap-6 mb-10">
        {/* Poster */}
        <Link to={`/gps/${saison}/${slug}`} className="hidden sm:block w-48 shrink-0 rounded-lg overflow-hidden border border-line aspect-[2/3] bg-card-hover hover:border-subtle transition-colors">
          {race.poster_url ? (
            <img src={race.poster_url} alt={race.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-card-hover to-card">
              <span className="text-5xl">{getCountryFlag(race.country)}</span>
              <span className="text-center text-[11px] font-medium text-subtle uppercase tracking-wide leading-tight px-2">{race.name}</span>
            </div>
          )}
        </Link>

        {/* Main info */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 text-sm text-subtle">
            <Link to="/gps" className="hover:text-white transition-colors">GPs</Link>
            <span>/</span>
            <Link to={`/saisons/${saison}`} className="hover:text-white transition-colors">{saison}</Link>
            <span>/</span>
            <Link to={`/gps/${saison}/${slug}`} className="hover:text-white transition-colors">{race.name}</Link>
          </div>
          <h1 className="font-display font-black italic text-6xl uppercase tracking-tight text-white leading-none pr-3">{race.name}</h1>
          <p className="text-lg text-muted capitalize">{formattedDate}</p>
          <p className="text-lg text-muted">{race.circuit} · {race.country}</p>
        </div>

        {/* Reviewer's rating card */}
        <div className="hidden sm:flex flex-col w-52 shrink-0 rounded-lg border border-line bg-card p-4">
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Link to={`/${reviewer.username}`} className="group flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-card-hover border border-line overflow-hidden">
                {reviewer.avatar_url ? (
                  <img src={reviewer.avatar_url} alt={reviewer.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg font-black text-subtle">{reviewer.display_name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <p className="text-sm font-semibold text-white group-hover:text-f1-red transition-colors">{reviewer.display_name}</p>
            </Link>

            {reviewerRating != null ? (
              <div className="flex flex-col items-center gap-1.5">
                <StarRating value={reviewerRating} size="lg" />
                <span className="text-3xl font-black text-star tabular-nums">{reviewerRating.toFixed(1)}</span>
              </div>
            ) : (
              <p className="text-xs text-subtle italic">No rating</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Review content ── */}
      <div className="space-y-6">
        {/* Mobile: reviewer info */}
        <div className="sm:hidden flex items-center gap-3 mb-4">
          <Link to={`/${reviewer.username}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-card-hover border border-line overflow-hidden">
              {reviewer.avatar_url ? (
                <img src={reviewer.avatar_url} alt={reviewer.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-xs font-black text-subtle">{reviewer.display_name?.[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-white">{reviewer.display_name}</span>
          </Link>
          {reviewerRating != null && <StarRating value={reviewerRating} size="sm" showValue />}
        </div>

        <div className="rounded-lg border border-line bg-card p-6 space-y-4">
          {review.spoiler && (
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-card-hover border border-line text-subtle uppercase tracking-wide">
              Spoiler
            </span>
          )}

          <p className="text-base text-muted leading-relaxed whitespace-pre-line">{review.content}</p>

          <div className="flex items-center justify-between pt-2 border-t border-line">
            <div className="flex items-center gap-4">
              {user && user.id !== reviewer.id && (
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${isLiked ? 'text-f1-red' : 'text-subtle hover:text-white'}`}
                >
                  <span>{isLiked ? '♥' : '♡'}</span>
                  <span>{likeCount}</span>
                </button>
              )}
              {(user?.id === reviewer.id || !user) && likeCount > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-subtle">
                  <span>♥</span>
                  <span>{likeCount}</span>
                </span>
              )}
            </div>
            <span className="text-xs text-subtle">{reviewDate}</span>
          </div>
        </div>

        {/* ── Liked by ── */}
        {likers.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-subtle uppercase tracking-widest font-semibold">Liked by</p>
            <div className="flex flex-wrap gap-2">
              {likers.map((liker) => (
                <Link
                  key={liker.id}
                  to={`/${liker.username}`}
                  title={liker.display_name}
                  className="group relative"
                >
                  <div className="w-9 h-9 rounded-full bg-card-hover border border-line overflow-hidden hover:border-subtle transition-colors">
                    {liker.avatar_url ? (
                      <img src={liker.avatar_url} alt={liker.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-bold text-subtle">{liker.display_name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-card border border-line text-[10px] text-white font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {liker.display_name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
